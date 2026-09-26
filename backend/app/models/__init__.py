# Re-export all models and schemas for clean imports
# Usage: from app.models import User, Product, Receipt, StockLedger, ...

from .user import (
    User,
    UserCreate,
    UserRead,
    UserUpdate,
    PasswordUpdate,
    UserRole,
    OTPToken,
    LoginRequest,
    TokenResponse,
    OTPRequest,
    OTPVerify,
    PasswordReset,
)

from .warehouse import (
    Warehouse,
    WarehouseCreate,
    WarehouseRead,
    WarehouseUpdate,
    Location,
    LocationCreate,
    LocationRead,
    LocationUpdate,
    LocationType,
)

from .product import (
    ProductCategory,
    ProductCategoryCreate,
    ProductCategoryRead,
    UnitOfMeasure,
    UnitOfMeasureCreate,
    UnitOfMeasureRead,
    Supplier,
    SupplierCreate,
    SupplierRead,
    SupplierUpdate,
    Product,
    ProductCreate,
    ProductRead,
    ProductUpdate,
    ProductStockRead,
    ReorderRule,
    ReorderRuleCreate,
    ReorderRuleRead,
)

from .operation import (
    OperationStatus,
    Receipt,
    ReceiptLine,
    ReceiptCreate,
    ReceiptRead,
    ReceiptUpdate,
    ReceiptValidate,
    ReceiptLineCreate,
    ReceiptLineRead,
    DeliveryOrder,
    DeliveryLine,
    DeliveryOrderCreate,
    DeliveryOrderRead,
    DeliveryLineCreate,
    DeliveryLineRead,
    InternalTransfer,
    TransferLine,
    InternalTransferCreate,
    InternalTransferRead,
    TransferLineCreate,
    TransferLineRead,
    StockAdjustment,
    AdjustmentLine,
    StockAdjustmentCreate,
    StockAdjustmentRead,
    AdjustmentLineCreate,
    AdjustmentLineRead,
)

from .stock import (
    MovementType,
    StockLedger,
    StockLedgerRead,
    StockQuant,
    StockQuantRead,
    DashboardKPIs,
    LowStockAlert,
)

__all__ = [
    # User & Auth
    "User", "UserCreate", "UserRead", "UserUpdate", "PasswordUpdate",
    "UserRole", "OTPToken", "LoginRequest", "TokenResponse",
    "OTPRequest", "OTPVerify", "PasswordReset",
    # Warehouse
    "Warehouse", "WarehouseCreate", "WarehouseRead", "WarehouseUpdate",
    "Location", "LocationCreate", "LocationRead", "LocationUpdate", "LocationType",
    # Product
    "ProductCategory", "ProductCategoryCreate", "ProductCategoryRead",
    "UnitOfMeasure", "UnitOfMeasureCreate", "UnitOfMeasureRead",
    "Supplier", "SupplierCreate", "SupplierRead", "SupplierUpdate",
    "Product", "ProductCreate", "ProductRead", "ProductUpdate", "ProductStockRead",
    "ReorderRule", "ReorderRuleCreate", "ReorderRuleRead",
    # Operations
    "OperationStatus",
    "Receipt", "ReceiptLine", "ReceiptCreate", "ReceiptRead",
    "ReceiptUpdate", "ReceiptValidate", "ReceiptLineCreate", "ReceiptLineRead",
    "DeliveryOrder", "DeliveryLine", "DeliveryOrderCreate", "DeliveryOrderRead",
    "DeliveryLineCreate", "DeliveryLineRead",
    "InternalTransfer", "TransferLine", "InternalTransferCreate", "InternalTransferRead",
    "TransferLineCreate", "TransferLineRead",
    "StockAdjustment", "AdjustmentLine", "StockAdjustmentCreate", "StockAdjustmentRead",
    "AdjustmentLineCreate", "AdjustmentLineRead",
    # Stock
    "MovementType", "StockLedger", "StockLedgerRead",
    "StockQuant", "StockQuantRead",
    "DashboardKPIs", "LowStockAlert",
]
