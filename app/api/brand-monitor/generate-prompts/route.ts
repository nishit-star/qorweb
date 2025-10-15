import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { handleApiError, AuthenticationError, ValidationError } from '@/lib/api-errors';
import { generatePromptsForCompany } from '@/lib/ai-utils';

export async function POST(request: NextRequest) {
  try {
    const sessionResponse = await auth.api.getSession({ headers: request.headers });
    if (!sessionResponse?.user) {
      throw new AuthenticationError('Please log in to use this feature');
    }

    const body = await request.json();
    const { company, competitors } = body || {};

    if (!company || !company.name) {
      throw new ValidationError('Invalid request', { company: 'Company object with name is required' });
    }

    const competitorNames: string[] = Array.isArray(competitors)
      ? competitors.map((c: any) => (typeof c === 'string' ? c : c?.name)).filter(Boolean)
      : [];

    const prompts = await generatePromptsForCompany(company, competitorNames);

    return NextResponse.json({ prompts });
  } catch (error) {
    return handleApiError(error);
  }
}
