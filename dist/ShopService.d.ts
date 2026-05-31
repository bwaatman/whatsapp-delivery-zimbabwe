export interface Shop {
    id: string;
    name: string;
    contact_phone: string;
    shop_location?: string;
    shop_address?: string;
    operating_hours?: any;
    is_open: boolean;
    active: boolean;
    registration_status?: 'pending' | 'approved' | 'rejected' | 'suspended';
    approved_by?: string;
    approved_at?: string;
    rejection_reason?: string;
    business_license_number?: string;
    business_description?: string;
    category_id?: string;
    password?: string;
    registration_data?: any;
    created_at: string;
    updated_at: string;
}
export interface Product {
    id?: string;
    merchant_id: string;
    name: string;
    description?: string;
    price: number;
    category?: string;
    is_available: boolean;
    preparation_time_minutes: number;
    delivery_time?: number;
    delivery_time_unit?: string;
    image_url?: string;
    created_at?: string;
    updated_at?: string;
}
export interface ProductImage {
    id?: string;
    product_id: string;
    image_url: string;
    is_primary: boolean;
    display_order: number;
    created_at?: string;
}
export interface ShopOrder {
    id: string;
    customer_phone: string;
    status: string;
    order_details?: string;
    delivery_location?: string;
    created_at: string;
    shop_confirmed_at?: string;
    ready_for_pickup_at?: string;
    assigned_driver_id?: string;
    estimated_delivery_time?: string;
}
export interface ShopDashboardSummary {
    shop_id: string;
    shop_name: string;
    pending_orders: number;
    confirmed_orders: number;
    preparing_orders: number;
    ready_orders: number;
    assigned_orders: number;
    out_for_delivery_orders: number;
    delivered_orders: number;
    today_orders: number;
}
export declare class ShopService {
    getShopById(shopId: string): Promise<Shop | null>;
    getShopByPhone(phone: string): Promise<Shop | null>;
    getShopOrders(shopId: string, statusFilter?: string): Promise<ShopOrder[]>;
    getPendingOrders(shopId: string): Promise<ShopOrder[]>;
    getConfirmedOrders(shopId: string): Promise<ShopOrder[]>;
    getPreparingOrders(shopId: string): Promise<ShopOrder[]>;
    getReadyForPickupOrders(shopId: string): Promise<ShopOrder[]>;
    getAssignedOrders(shopId: string): Promise<ShopOrder[]>;
    confirmOrder(orderId: string): Promise<boolean>;
    startPreparingOrder(orderId: string): Promise<boolean>;
    markOrderReadyForPickup(orderId: string, estimatedDeliveryMinutes?: number): Promise<boolean>;
    updateShopLocation(shopId: string, latitude: number, longitude: number, address?: string): Promise<boolean>;
    updateShopOperatingHours(shopId: string, operatingHours: any): Promise<boolean>;
    toggleShopStatus(shopId: string, isOpen: boolean): Promise<boolean>;
    getShopDashboardSummary(shopId: string): Promise<ShopDashboardSummary | null>;
    getOrderDeliveryDistance(orderId: string): Promise<number | null>;
    createShop(name: string, contactPhone: string, shopAddress?: string): Promise<Shop | null>;
    createProduct(product: Product): Promise<Product | null>;
    getProducts(merchantId: string): Promise<Product[]>;
    getProduct(productId: string): Promise<Product | null>;
    updateProduct(productId: string, updates: Partial<Product>): Promise<boolean>;
    deleteProduct(productId: string): Promise<boolean>;
    addProductImage(productImage: ProductImage): Promise<ProductImage | null>;
    getProductImages(productId: string): Promise<ProductImage[]>;
    deleteProductImage(imageId: string): Promise<boolean>;
    setPrimaryProductImage(productId: string, imageId: string): Promise<boolean>;
    getProductsWithImages(merchantId: string): Promise<any[]>;
    setShopCategory(shopId: string, categoryId: string): Promise<boolean>;
    submitVendorRegistration(registrationData: any): Promise<any>;
}
//# sourceMappingURL=ShopService.d.ts.map