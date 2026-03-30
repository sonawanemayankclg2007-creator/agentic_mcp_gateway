from openai import OpenAI
import os
from dotenv import load_dotenv

# Load .env
load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def generate_workflow(user_input):
    prompt = f"""
    Convert this into workflow JSON:

    {user_input}

    Return tasks and edges.
    """

    response = client.chat.completions.create(
        model="gpt-4.1-mini",
        messages=[{"role": "user", "content": prompt}]
    )

    return response.choices[0].message.content