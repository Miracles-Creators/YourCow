export class LoginDto {
  email!: string;
  name?: string;
  role?: "INVESTOR" | "PRODUCER" | "ADMIN";
}
