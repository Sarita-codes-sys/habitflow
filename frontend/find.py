import re

with open('src/pages/AnalyticsPage.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = re.sub(r"'[^']*'", '', text)
text = re.sub(r"\"[^\"]*\"", '', text)
text = re.sub(r"`[^`]*`", '', text)
text = re.sub(r"//.*", '', text)

stack = []
lines = text.split('\n')
for line_num, line in enumerate(lines, 1):
    for char in line:
        if char == '{':
            stack.append(line_num)
        elif char == '}':
            if stack:
                stack.pop()
            else:
                print(f'Extra close brace at line {line_num}')

if stack:
    for s in stack:
        print(f'Unclosed open brace from line {s}')
else:
    print('Perfectly matched braces!')
