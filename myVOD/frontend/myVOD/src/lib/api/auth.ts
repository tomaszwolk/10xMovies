import { http } from "@/lib/http";
import type {
  RegisterUserCommand,
  RegisteredUserDto,
  LoginUserCommand,
  AuthTokensDto,
  UserProfileDto
} from "@/types/api.types";

/**
 * Register a new user.
 * @param payload - User registration data (email and password)
 * @returns Registered user data (email only)
 * @throws API error with status and data
 */
export async function registerUser(
  payload: RegisterUserCommand
): Promise<RegisteredUserDto> {
  const { data } = await http.post<RegisteredUserDto>("/register/", payload);
  return data;
}

/**
 * Authenticate user and obtain JWT tokens.
 * @param payload - Login credentials (email and password)
 * @returns JWT access and refresh tokens
 * @throws API error with status and data (401 for invalid credentials)
 */
export async function loginUser(
  payload: LoginUserCommand
): Promise<AuthTokensDto> {
  const { data } = await http.post<AuthTokensDto>("/token/", payload);
  return data;
}

/**
 * Refresh the access token using a refresh token.
 * @param refreshToken - The refresh token
 * @returns New access token
 * @throws API error if refresh token is invalid or expired
 */
export async function refreshAccessToken(
  refreshToken: string
): Promise<{ access: string }> {
  const { data } = await http.post<{ access: string }>("/token/refresh/", {
    refresh: refreshToken,
  });
  return data;
}

/**
 * Get the current user's profile.
 * @returns User profile data including selected platforms
 * @throws API error with status and data
 */
export async function getUserProfile(): Promise<UserProfileDto> {
  const { data } = await http.get<UserProfileDto>("/me/");
  return data;
}

