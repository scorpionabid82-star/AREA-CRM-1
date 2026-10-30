import React, { useState } from 'react';
import {
  Boxes,
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Check,
  Send,
  Building2,
  Package,
  Info,
  Layers,
  ArrowRight,
  AlertTriangle
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { InventoryProduct, InventorySubTab } from '../../types/crm';
import { Tooltip } from '../common/Tooltip';

interface CartItem {
  product: InventoryProduct;
  quantity: number;
}

interface DiyProductsViewProps {
  onNavigateTab: (tab: InventorySubTab) => void;
  selectedBranchIdFilter?: string;
}

export const DiyProductsView: React.FC<DiyProductsViewProps> = ({
  onNavigateTab,
  selectedBranchIdFilter,
}) => {
  const {
    inventoryProducts,
    currentRole,
    currentUser,
    branches,
    createInventoryOrder,
    showToast,
  } = useCrm();

  const isTexnobaba = currentRole === 'texnobaba_meneceri';
  const isManager = currentRole === 'menecer';
  const managerBranchId = isManager && currentUser?.branchId && currentUser.branchId !== 'all' ? currentUser.branchId : null;
  const effectiveBranchId = managerBranchId || (selectedBranchIdFilter && selectedBranchIdFilter !== 'all' ? selectedBranchIdFilter : branches.find(b => !b.isDeleted)?.id || 'branch-nerimanov');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [orderReason, setOrderReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter DIY products
  const diyProducts = inventoryProducts.filter(p => p.type === 'diy' && !p.isArchived);

  const categories = ['all', ...Array.from(new Set(diyProducts.map(p => p.category)))];

  const filteredProducts = diyProducts.filter(p => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAddToCart = (product: InventoryProduct) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const handleUpdateQty = (productId: string, newQty: number) => {
    if (newQty <= 0) {
      setCart(prev => prev.filter(i => i.product.id !== productId));
    } else {
      setCart(prev =>
        prev.map(i => (i.product.id === productId ? { ...i, quantity: newQty } : i))
      );
    }
  };

  const handleRemoveItem = (productId: string) => {
    setCart(prev => prev.filter(i => i.product.id !== productId));
  };

  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    if (!orderReason.trim()) {
      showToast('Zəhmət olmasa tədris materialı tələbinin səbəbini və təyinatını qeyd edin.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      createInventoryOrder({
        branchId: effectiveBranchId,
        type: 'diy',
        items: cart.map(i => ({
          productId: i.product.id,
          requestedQty: i.quantity,
          unitPrice: 0,
        })),
        reason: orderReason.trim(),
      });

      setCart([]);
      setOrderReason('');
      setIsCartOpen(false);
      showToast('DIY materialları sifarişi uğurla Texnobaba mərkəzinə göndərildi!', 'success');
      onNavigateTab('orders');
    } catch {
      showToast('Sifariş yaradılarkən xəta baş verdi.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeBranchName = branches.find(b => b.id === effectiveBranchId)?.name || 'Filial';

  return (
    <div className="space-y-6">
      {/* Header & Cart Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">DIY Tədris Materialları Kataloqu</h2>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Dövri Təminat
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Filiallar üçün təyin edilmiş kvota və qrafik üzrə təmənnasız verilən tədris vəsaitləri
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsCartOpen(!isCartOpen)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer relative"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Səbət ({totalItemsCount})</span>
            {totalItemsCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 absolute top-1 right-1 ring-2 ring-indigo-600" />
            )}
          </button>
        </div>
      </div>

      {/* Info notice about DIY ordering policy */}
      <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong>DIY Materialları Siyasəti:</strong> DIY materialları filialların tədris planına uyğun olaraq Texnobaba mərkəzi anbarından göndərilir. Filial meneceri sifarişi formalaşdırır, Texnobaba meneceri anbar qalığına əsasən təsdiq edir və kuryerlə göndərir. Məhsul filial tərəfindən təhvil alındıqda avtomatik filial inventarına köçürülür.
        </div>
      </div>

      {/* Search & Categories */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="DIY materialının adını və ya təsvirini axtarın..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {cat === 'all' ? 'Bütün Kateqoriyalar' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.map(product => {
          const inCart = cart.find(i => i.product.id === product.id);
          const isLowStock = product.centralStock <= product.minStockAlert;

          return (
            <div
              key={product.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all group"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    {product.category}
                  </span>
                  <Tooltip
                    content={
                      product.centralStock > 0
                        ? isLowStock
                          ? `Kritik qalıq: ${product.centralStock} ${product.unit} (Minimum: ${product.minStockAlert})`
                          : `Mərkəzi anbar qalığı: ${product.centralStock} ${product.unit}`
                        : 'Mərkəzi anbarda tükənib'
                    }
                  >
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded ${
                        product.centralStock > 0
                          ? isLowStock
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {product.centralStock > 0 ? (
                        isLowStock ? (
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                        ) : (
                          <Package className="w-3 h-3 text-emerald-600" />
                        )
                      ) : (
                        <AlertTriangle className="w-3 h-3 text-rose-600" />
                      )}
                      <span>{product.centralStock} {product.unit}</span>
                    </span>
                  </Tooltip>
                </div>

                <h3 className="text-sm font-bold text-slate-900 mt-3 group-hover:text-indigo-600 transition-colors">
                  {product.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                  {product.description || 'Tədris qrupları üçün standart DIY konstruksiyası.'}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block">Ölçü Vahidi:</span>
                  <span className="text-xs font-semibold text-slate-700 capitalize">{product.unit}</span>
                </div>

                {inCart ? (
                  <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
                    <Tooltip content="Miqdarı azalt">
                      <button
                        onClick={() => handleUpdateQty(product.id, inCart.quantity - 1)}
                        className="w-6 h-6 rounded bg-white text-slate-700 hover:bg-slate-200 flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
                        aria-label="Azalt"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                    </Tooltip>
                    <span className="w-7 text-center text-xs font-bold font-mono text-slate-900">
                      {inCart.quantity}
                    </span>
                    <Tooltip content="Miqdarı artır">
                      <button
                        onClick={() => handleUpdateQty(product.id, inCart.quantity + 1)}
                        className="w-6 h-6 rounded bg-white text-slate-700 hover:bg-slate-200 flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
                        aria-label="Artır"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </Tooltip>
                  </div>
                ) : (
                  <Tooltip content={product.centralStock > 0 ? "Səbətə əlavə et" : "Anbarda mövcud deyil"}>
                    <button
                      onClick={() => handleAddToCart(product)}
                      disabled={product.centralStock === 0}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer ${
                        product.centralStock > 0
                          ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Səbətə At</span>
                    </button>
                  </Tooltip>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Cart Modal / Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">DIY Sifariş Səbəti</h3>
                <span className="text-[11px] font-bold font-mono px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                  {totalItemsCount} ədəd
                </span>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Bağla
              </button>
            </div>

            <form onSubmit={handleSubmitOrder} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-4 flex-1 overflow-y-auto space-y-4">
                {/* Target Branch Indicator */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs flex items-center justify-between">
                  <span className="text-slate-500">Sifarişçi Filial:</span>
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                    {activeBranchName}
                  </span>
                </div>

                {/* Items in cart */}
                {cart.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    Səbət boşdur. Kataloqdan məhsulları əlavə edin.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {cart.map(item => (
                      <div
                        key={item.product.id}
                        className="p-3 rounded-xl border border-slate-200 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-slate-900 truncate">{item.product.name}</p>
                          <p className="text-[11px] text-slate-400">
                            {item.product.category} · Anbarda: {item.product.centralStock} {item.product.unit}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
                            <button
                              type="button"
                              onClick={() => handleUpdateQty(item.product.id, item.quantity - 1)}
                              className="w-5 h-5 rounded bg-white text-slate-700 hover:bg-slate-200 flex items-center justify-center font-bold cursor-pointer"
                            >
                              <Minus className="w-2.5 h-2.5" />
                            </button>
                            <span className="w-6 text-center font-bold font-mono text-slate-900">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleUpdateQty(item.product.id, item.quantity + 1)}
                              className="w-5 h-5 rounded bg-white text-slate-700 hover:bg-slate-200 flex items-center justify-center font-bold cursor-pointer"
                            >
                              <Plus className="w-2.5 h-2.5" />
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.product.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Order Reason Requirement */}
                {cart.length > 0 && (
                  <div className="space-y-1.5 pt-2">
                    <label className="text-xs font-bold text-slate-700">
                      Sifarişin Əsası və Təyinatı <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={orderReason}
                      onChange={e => setOrderReason(e.target.value)}
                      placeholder="Məsələn: Oktyabr ayı yeni açılan 3 robototexnika qrupu üçün 15 tələbəlik material tələbi..."
                      className="w-full p-2.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setCart([])}
                    className="text-xs text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
                  >
                    Səbəti Təmizlə
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSubmitting ? 'Göndərilir...' : 'Sifarişi Texnobabaya Göndər'}</span>
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
