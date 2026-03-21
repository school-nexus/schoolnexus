import { generateFrontendTestPlan } from '../node_modules/@testsprite/testsprite-mcp/dist/index.js';
import path from 'path';

const projectPath = process.cwd();

async function run() {
    console.log('Generating TestSprite Frontend Test Plan...');
    try {
        const result = await generateFrontendTestPlan({
            projectPath: projectPath,
            needLogin: false
        });
        console.log('✅ Test plan generation triggered.');
        console.log('Result:', JSON.stringify(result, null, 2));
    } catch (error) {
        console.error('❌ Error generating test plan:', error);
    }
}

run();
