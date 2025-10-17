import { ChangeDetectionStrategy, Component, inject, signal, Injector } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzUploadModule, NzUploadFile } from 'ng-zorro-antd/upload';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import {  NzMessageService } from 'ng-zorro-antd/message';
import { AuthService } from '@auth0/auth0-angular';
import { firstValueFrom } from 'rxjs';
import { UserApiService } from '../api/user-api.service';

@Component({
  selector: 'app-main-layout',
  imports: [
    RouterOutlet,
    RouterLink,
    NzIconModule,
    NzLayoutModule,
    NzMenuModule,
    NzAvatarModule,
    NzModalModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzUploadModule,
    ReactiveFormsModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './main-layout.html',
  styleUrls: ['./main-layout.scss']
})
export class MainLayout {
  isCollapsed = false;
  // profile modal state
  isProfileOpen = signal(false);
  avatarUrl = signal<string | null>(null);
  private readonly fb = inject(FormBuilder);
  private readonly message = inject(NzMessageService);
  // Use Injector to lazily get AuthService at runtime so SSR won't try to instantiate it
  private readonly injector = inject(Injector);
  private readonly api = inject(UserApiService);

  profileForm: FormGroup = this.fb.group({
    displayName: ['', [Validators.maxLength(80)]],
    password: ['', [Validators.minLength(6)]],
    confirm: ['']
  });

  openProfile(): void {
    this.isProfileOpen.set(true);
  }

  closeProfile(): void {
    this.isProfileOpen.set(false);
  }

  async beforeUpload(file: NzUploadFile): Promise<boolean> {
    const raw = file.originFileObj as File | undefined;
    if (!raw) return false;
    const dataUrl = await this.readAsDataURL(raw);
    this.avatarUrl.set(dataUrl);
    return false; // prevent auto upload; we manage it client-side for now
  }

  private readAsDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async saveProfile(): Promise<void> {
    const { password, confirm, displayName } = this.profileForm.value as {
      displayName?: string;
      password?: string;
      confirm?: string;
    };
    if (password && password.length < 6) {
      this.message.error('Password must be at least 6 characters.');
      return;
    }
    if (password && password !== confirm) {
      this.message.error('Passwords do not match.');
      return;
    }
    try {
      let token: string | undefined;
      const auth = this.injector.get(AuthService, null as any) as AuthService | null;
      if (auth) {
        try {
          token = await firstValueFrom(auth.getAccessTokenSilently());
        } catch {}
      }
      const avatarDataUrl = this.avatarUrl();
      // Update profile first
      const resp = await firstValueFrom(
        this.api.updateMyProfile(displayName || null, avatarDataUrl || null, token)
      );
      const graphQLErrors = (resp as { errors?: readonly { message?: string }[] }).errors;
      if (graphQLErrors?.length) {
        throw new Error(graphQLErrors[0]?.message ?? 'Failed to update profile');
      }
      const updatedUser = resp.data?.updateMyProfile;
      if (updatedUser?.avatarUrl) {
        this.avatarUrl.set(updatedUser.avatarUrl);
      }
      // Then set password if provided
      if (password) {
        await firstValueFrom(this.api.setMyPassword(password, token));
      }
      this.message.success('Profile updated');
      this.isProfileOpen.set(false);
    } catch (err: any) {
      this.message.error(err?.message || 'Failed to update profile');
    }
  }
}
