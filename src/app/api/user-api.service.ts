import { Injectable, inject } from '@angular/core';
import { Apollo } from 'apollo-angular';
import gql from 'graphql-tag';
import { HttpHeaders } from '@angular/common/http';

type UpdateMyProfileData = {
  updateMyProfile: { id: number; name: string | null; avatarUrl: string | null };
};

type UpdateMyProfileVariables = {
  input: { name?: string | null; avatarDataUrl?: string | null };
};

type SetMyPasswordData = { setMyPassword: { id: number } };

type SetMyPasswordVariables = { password: string };

@Injectable({ providedIn: 'root' })
export class UserApiService {
  private apollo = inject(Apollo);

  updateMyProfile(name: string | null | undefined, avatarDataUrl: string | null | undefined, token?: string) {
    const mutation = gql`
      mutation UpdateMyProfile($input: UpdateProfileInput!) {
        updateMyProfile(input: $input) { id name avatarUrl }
      }
    `;
    const input: UpdateMyProfileVariables['input'] = {};
    if (name !== undefined) {
      input.name = name;
    }
    if (avatarDataUrl !== undefined) {
      input.avatarDataUrl = avatarDataUrl;
    }
    return this.apollo.mutate<UpdateMyProfileData, UpdateMyProfileVariables>({
      mutation,
      variables: { input },
      context: token
        ? { headers: new HttpHeaders().set('Authorization', `Bearer ${token}`) }
        : undefined,
    });
  }

  setMyPassword(password: string, token?: string) {
    const mutation = gql`
      mutation SetMyPassword($password: String!) { setMyPassword(password: $password) { id } }
    `;
    return this.apollo.mutate<SetMyPasswordData, SetMyPasswordVariables>({
      mutation,
      variables: { password },
      context: token
        ? { headers: new HttpHeaders().set('Authorization', `Bearer ${token}`) }
        : undefined,
    });
  }
}
