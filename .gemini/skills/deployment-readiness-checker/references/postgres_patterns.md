# PostgreSQL Common Patterns

## JSON Comparison Fix
In PostgreSQL, the `JSON` type doesn't support the `=` operator. Use string casting for safe comparison:

```python
from sqlalchemy import cast, String
db.query(Model).filter(cast(Model.json_col, String) == json.dumps(data))
```

## GUID/UUID Handler
PostgreSQL driver returns `uuid.UUID` objects. The `process_result_value` should check for this:

```python
def process_result_value(self, value, dialect):
    if value is None:
        return value
    if not isinstance(value, uuid.UUID):
        return uuid.UUID(value)
    return value
```
