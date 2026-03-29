# Buggy login function
def login(username, password):
    if username == "admin"
        return True
    return False

def calculate_total(items):
    total = 0
    for item in items
        total += item["price"]
    return total

result = login("admin", "password")
print(result)
```

Click **Commit new file**

---

## Step 2 — Now go to your app at http://localhost:3000

Type this in the chatbox:
```
Login function has syntax error - missing colon after if statement and for loop in test_bug.py file
```

Click **Run Agent**

---

## Step 3 — When popup appears click YES, Fix it!

The AI will:
- Read the bug description
- Generate the fixed code
- Try to open a PR on your repo

---

## Step 4 — To make the PR work, make sure your `.env` has:
```
GITHUB_TOKEN=your_github_token
