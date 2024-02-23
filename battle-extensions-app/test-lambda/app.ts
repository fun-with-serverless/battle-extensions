import { randomBytes } from 'crypto';

const analyticsService = 'http://localhost:3000/analytics';

export const lambdaHandler = async (): Promise<{ status: string }> => {
    try {
        await fetch(analyticsService, {
            method: 'POST',
            body: JSON.stringify({ action: randomBytes(5).toString('hex') }),
            headers: {
                'Content-Type': 'application/json',
            },
        });
    } catch (error) {
        return { status: 'error' };
    }

    return { status: 'ok' };
};
