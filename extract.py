import json

with open("drone_notebook.ipynb", "r", encoding="utf-8") as f:
    nb = json.load(f)

code = []
for cell in nb.get("cells", []):
    if cell["cell_type"] == "code":
        source = "".join(cell.get("source", []))
        code.append(source)

with open("drone_notebook.py", "w", encoding="utf-8") as f:
    f.write("\n\n# --- Cell ---\n\n".join(code))
