"""
KrishiMitra — Mandi Price Integration Client
==============================================
Interfaces with public Indian agricultural rates endpoints:
- data.gov.in / OGD Platform (requiring API key)
- Ashoka University's CEDA API (free public endpoint)
"""
import httpx
from typing import Optional, List
CEDA_BASE_URL = "https://api.ceda.ashoka.edu.in/v1"

    
async def fetch_mandi_rates_ceda(commodity: str, state: Optional[str] = None) -> List[dict]:
    """
    Fetch mandi rates from the CEDA public API.
    Returns list of mandis, varieties, average prices, and minimum/maximum prices.
    """
    # URL structure: https://api.ceda.ashoka.edu.in/v1/agmarknet/prices
    url = f"{CEDA_BASE_URL}/agmarknet/prices"

    params = {
        "commodity": commodity,
        "limit": 50
    }
    if state:
        params["state"] = state
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params, timeout=15.0)
            if response.status_code == 200:
                data = response.json()
                # CEDA response standard parsing:
                results = data.get("results", [])
                formatted_results = []
                for item in results:
                    formatted_results.append({
                        "mandi": item.get("market"),
                        "district": item.get("district"),
                        "state": item.get("state"),
                        "variety": item.get("variety"),
                        "min_price": item.get("min_price"),
                        "max_price": item.get("max_price"),
                        "modal_price": item.get("modal_price"),  # Common selling price
                        "date": item.get("date")
                    })
                return formatted_results
            return []
    except Exception as e:
        print(f"CEDA Mandi API Error: {e}")
        return []
async def fetch_mandi_rates_mock(commodity: str, state: Optional[str] = None) -> List[dict]:
    """
    Fallback mock generator representing actual daily market price feeds
    in case external network access to the API endpoints fails.
    """
    import random
    from datetime import datetime
    mock_mandis = {
        "Maharashtra": ["Pune", "Mumbai", "Nagpur", "Nashik"],
        "Punjab": ["Ludhiana", "Amritsar", "Jalandhar", "Patiala"],
        "Karnataka": ["Bangalore", "Mysore", "Hubli", "Belgaum"],
        "Uttar Pradesh": ["Kanpur", "Lucknow", "Varanasi", "Agra"],
    }

    selected_state = state if state in mock_mandis else random.choice(list(mock_mandis.keys()))
    mandis = mock_mandis[selected_state]

    base_price = {
        "wheat": 2200,
        "rice": 2500,
        "cotton": 6000,
        "maize": 1900,
        "sugarcane": 350
    }.get(commodity.lower(), 2000)
    results = []
    for mandi in mandis:
        var_pct = random.uniform(-0.1, 0.1)
        modal = round(base_price * (1 + var_pct))
        min_p = round(modal * 0.9)
        max_p = round(modal * 1.1)

        results.append({
            "mandi": f"{mandi} Market",
            "district": mandi,
            "state": selected_state,
            "variety": "Local / Standard",
            "min_price": min_p,
            "max_price": max_p,
            "modal_price": modal,
            "date": datetime.today().strftime("%Y-%m-%d")
        })

    return results