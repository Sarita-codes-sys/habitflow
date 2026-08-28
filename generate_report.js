const fs = require('fs');
const path = require('path');

const files = [
    'README.md',
    'PRD (1).md',
    'REQUIREMENTS.md',
    'ARCHITECTURE.md',
    'TECH_STACK.md',
    'FRONTEND.md',
    'BACKEND.md',
    'DATABASE.md',
    'API.md',
    'SECURITY (1).md',
    'TESTING.md',
    'DEPLOYMENT.md',
    'ANALYTICS.md',
    'AI_INSIGHTS.md',
    'ROADMAP.md',
    'DECISIONS.md',
    'CODING_STANDARDS.md'
];

let reportContent = '# HabitFlow Project Report\n\n';

for (const file of files) {
    if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf-8');
        reportContent += `<div style="page-break-after: always;"></div>\n\n`;
        reportContent += `## ${file.replace('.md', '').replace(' (1)', '')}\n\n`;
        reportContent += content + '\n\n';
    }
}

fs.writeFileSync('HabitFlow_Report.md', reportContent);
console.log('Report markdown generated.');
