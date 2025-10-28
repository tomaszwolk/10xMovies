import { http } from "@/lib/http";
import type { 
  RegisterUserCommand, 
  RegisteredUserDto,
  LoginUserCommand,
  AuthTokensDto
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

