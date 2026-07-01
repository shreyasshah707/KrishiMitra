"""
KrishiMitra — Mandi Market Rates Router
=========================================
GET /mandi/rates — Fetch daily wholesale crop prices from Indian mandis.
Connects to CEDA API with fallback to simulated live market data.
"""
from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from ..services.mandi_client import fetch_mandi_rates_ceda, fetch_mandi_rates_mock

router = APIRouter()


@router.get("/")
@router.get("/rates")
async def get_mandi_rates(
    commodity: str = Query(..., description="Crop name, e.g., Wheat, Rice, Cotton, Maize"),
    state: Optional[str] = Query(None, description="State filter, e.g., Maharashtra, Punjab"),
):
    """
    Fetch current daily wholesale prices for a commodity across Indian mandis.
    Integrates live CEDA feeds with auto-fallback to simulated region-specific prices.
    """
    try:
        # Try fetching from CEDA API first
        rates = await fetch_mandi_rates_ceda(commodity, state)
        source = "CEDA API"

        # If API returns empty or fails, use realistic mock data
        if not rates:
            rates = await fetch_mandi_rates_mock(commodity, state)
            source = "Simulated Live Market Feed"
        return {
            "status": "success",
            "commodity": commodity,
            "source": source,
            "count": len(rates),
            "data": rates
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch market rates: {str(e)}")