from config import ENGINE

if ENGINE == "cc":
    from engines.cc_adapter import chat
elif ENGINE == "api":
    from engines.api_adapter import chat
else:
    raise ValueError(f"Unknown engine: {ENGINE}")
