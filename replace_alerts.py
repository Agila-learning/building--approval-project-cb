import os
import re

directory = r"d:\Building Approval Software\frontend\src"

for root, _, files in os.walk(directory):
    for file in files:
        if file.endswith(".tsx") or file.endswith(".ts"):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()

            if 'alert(' in content:
                # Add import if not present
                if "import toast from 'react-hot-toast';" not in content:
                    # Find last import
                    imports = [m for m in re.finditer(r'^import .*?;$', content, re.MULTILINE)]
                    if imports:
                        last_import = imports[-1]
                        content = content[:last_import.end()] + "\nimport toast from 'react-hot-toast';" + content[last_import.end():]
                    else:
                        content = "import toast from 'react-hot-toast';\n" + content

                # Replace alerts. Simple heuristic: 
                # alert('Failed to submit enquiry.') -> toast.error('Failed to submit enquiry.')
                # alert('Thank you...') -> toast.success('Thank you...')
                
                # replace alert('Failed or alert("Failed
                content = re.sub(r'alert\(([\'"])(.*?[Ff]ail.*?)[\'"]\)', r'toast.error(\1\2\1)', content)
                content = re.sub(r'alert\(([\'"])(.*?[Ee]rror.*?)[\'"]\)', r'toast.error(\1\2\1)', content)
                content = re.sub(r'alert\(([\'"])(.*?[Ii]nvalid.*?)[\'"]\)', r'toast.error(\1\2\1)', content)
                
                # remaining alerts become toast.success
                content = re.sub(r'alert\(', r'toast.success(', content)

                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"Updated {file}")
