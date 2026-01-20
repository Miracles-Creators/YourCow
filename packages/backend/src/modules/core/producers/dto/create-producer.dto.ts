export class CreateProducerDto {
  name!: string;
  email!: string;
  senasaId!: string;
  location?: string;
  phone?: string;
  yearsOperating?: number;
  walletAddress?: string;
}
