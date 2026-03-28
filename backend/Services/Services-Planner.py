ctx_str = f"\nContext: {json.dumps(context)}" if context else ""
    messages.append({"role": "user", "content": user_input + ctx_str})
 
    try:
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=2000,
            system=SYSTEM_PROMPT,
            messages=messages
        )
        raw = response.content[0].text.strip()
        # Strip markdown code fences if present
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        plan = json.loads(raw)
        logger.info(f"Workflow plan generated: {plan.get('name')}")
        return plan
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse LLM response as JSON: {e}")
        return {"error": "Invalid JSON from LLM", "raw": raw}
    except Exception as e:
        logger.error(f"Planner error: {e}")
        raise