
export default defineNuxtRouteMiddleware((to) => {
  const token = useCookie('userInfo')
  const isAuthenticated = !!token.value

  const publicPaths = ['/login', '/signup', '/reset-password']

  const isPublicPage = publicPaths.some(path => to.path.startsWith(path));

  if (!isAuthenticated && !isPublicPage) {
    return navigateTo('/login')
  }

  if (isAuthenticated && isPublicPage) {
    return navigateTo('/dashboard')
  }

})
