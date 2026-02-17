
import { getEnforcementData } from './actions/enforcement';

async function main() {
    console.log('Testing getEnforcementData...');
    try {
        const result = await getEnforcementData();
        if (result.error) {
            console.error('Error returned:', result.error);
        } else {
            console.log('Success! Sessions found:', result.sessions.length);
            if (result.sessions.length > 0) {
                console.log('Sample session:', result.sessions[0]);
            }
        }
    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

main();
