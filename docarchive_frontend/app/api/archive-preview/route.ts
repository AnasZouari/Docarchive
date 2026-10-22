import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    {
      error:
        'Utilisez l’aperçu authentifié par identifiant de document.',
    },
    {
      status: 410,
    }
  );
}