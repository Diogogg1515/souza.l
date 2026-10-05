// WhatsApp precisa do código do país: se o número tem só DDD + telefone, soma o 55.
export function whatsappNumber(digits: string): string {
  return digits.length <= 11 ? `55${digits}` : digits;
}
