export function getUserInfoPropertyFromCookie(key: 'userId' | 'firstName' | 'specialization' | 'title' | 'email'): string | null {
  const userInfoCookie = useCookie<{
    userId: string
    firstName: string
    specialization: string
    title: string
    email: string
  } | null>('userInfo');

  return userInfoCookie.value?.[key] ?? null;
}
