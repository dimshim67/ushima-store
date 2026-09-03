import React, { useState, useEffect } from 'react';
import { X, Trash2, Send, Check, Copy, ArrowRight, ShieldCheck, ShoppingBag } from 'lucide-react';
import { CartItem, CustomerDetails, Order } from '../types';
import { getTelegramWebApp, isInsideTelegram, getTelegramUser, triggerHaptic } from '../utils/telegram';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  currency: string;
  botUsername: string;
  onUpdateQuantity: (productId: string, size: string, quantity: number) => void;
  onRemoveItem: (productId: string, size: string) => void;
  onClearCart: () => void;
  onOrderPlaced: (order: Order) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  currency,
  botUsername,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onOrderPlaced,
}) => {
  const [step, setStep] = useState<'cart' | 'checkout' | 'success'>('cart');
  const [copied, setCopied] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);

  const tgUser = getTelegramUser();
  const inTelegram = isInsideTelegram();

  const [customer, setCustomer] = useState<CustomerDetails>({
    name: tgUser ? `${tgUser.first_name || ''} ${tgUser.last_name || ''}`.trim() : '',
    telegramUsername: tgUser?.username ? `@${tgUser.username}` : '',
    phone: '',
    address: '',
    comment: '',
  });

  // Reset steps when opened with new cart
  useEffect(() => {
    if (isOpen) {
      if (items.length === 0 && step !== 'success') {
        setStep('cart');
      }
    }
  }, [isOpen, items.length, step]);

  if (!isOpen) return null;

  const total = items.reduce((acc, item) => acc + item.product.price * item.quantity, 0);

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;
    if (!customer.name.trim() || !customer.phone.trim()) {
      alert('Пожалуйста, укажите имя и номер телефона для связи.');
      return;
    }

    triggerHaptic('heavy');

    const orderId = `ARG-${Math.floor(1000 + Math.random() * 9000)}`;
    const newOrder: Order = {
      id: orderId,
      items: [...items],
      total,
      currency,
      customer: { ...customer },
      status: 'new',
      createdAt: new Date().toISOString(),
    };

    setPlacedOrder(newOrder);
    onOrderPlaced(newOrder);
    onClearCart();
    setStep('success');

    // If inside Telegram Mini App, attempt native sendData
    const tg = getTelegramWebApp();
    if (tg && tg.sendData) {
      try {
        const payload = {
          event: 'NEW_ORDER',
          orderId: newOrder.id,
          total: newOrder.total,
          currency: newOrder.currency,
          itemsCount: newOrder.items.length,
          items: newOrder.items.map((i) => `${i.product.title} (${i.selectedSize}) x${i.quantity}`),
          customer: newOrder.customer,
        };
        tg.sendData(JSON.stringify(payload));
      } catch (err) {
        console.warn('Telegram sendData failed:', err);
      }
    }
  };

  const getOrderTelegramText = (order: Order) => {
    const lines = [
      `🛍 НОВЫЙ ЗАКАЗ [${order.id}]`,
      `———————————————`,
      ...order.items.map(
        (i) => `• ${i.product.title} (${i.selectedSize}) × ${i.quantity} — ${(i.product.price * i.quantity).toLocaleString('ru-RU')} ${order.currency}`
      ),
      `———————————————`,
      `💰 Итого к оплате: ${order.total.toLocaleString('ru-RU')} ${order.currency}`,
      ``,
      `👤 Клиент: ${order.customer.name}`,
      `📱 Telegram: ${order.customer.telegramUsername || 'не указан'}`,
      `📞 Телефон: ${order.customer.phone}`,
      `📍 Адрес: ${order.customer.address || 'Самовывоз / уточнить'}`,
      order.customer.comment ? `💬 Примечание: ${order.customer.comment}` : '',
    ].filter(Boolean);

    return lines.join('\n');
  };

  const handleCopyOrder = () => {
    if (!placedOrder) return;
    triggerHaptic('light');
    const text = getOrderTelegramText(placedOrder);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenBot = () => {
    triggerHaptic('medium');
    const cleanBot = botUsername.replace(/^@/, '');
    const url = `https://t.me/${cleanBot}?start=${placedOrder ? placedOrder.id : 'order'}`;
    const tg = getTelegramWebApp();
    if (tg?.openTelegramLink) {
      tg.openTelegramLink(url);
    } else {
      window.open(url, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer panel */}
      <aside
        id="cart-drawer-panel"
        aria-label="Корзина покупок"
        className="absolute inset-y-0 right-0 max-w-full flex pl-6"
      >
        <div className="w-screen max-w-md bg-[#0e1013] border-l border-[#242932] shadow-2xl flex flex-col h-full">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-[#21262f] flex items-center justify-between bg-[#131519]">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-white" />
              <h2 className="font-display font-bold text-base sm:text-lg text-white">
                {step === 'cart' && 'КОРЗИНА ЗАКАЗА'}
                {step === 'checkout' && 'ОФОРМЛЕНИЕ И ДОСТАВКА'}
                {step === 'success' && 'ЗАКАЗ СФОРМИРОВАН'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#9ca3af] hover:text-white hover:bg-[#1e2229] transition-colors"
              aria-label="Закрыть"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content based on Step */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5">
            {step === 'cart' && (
              <>
                {items.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#64748b]">
                    <div className="w-16 h-16 rounded-full bg-[#16181e] border border-[#262c37] flex items-center justify-center mb-4 text-[#8892a0]">
                      <ShoppingBag className="w-7 h-7" />
                    </div>
                    <p className="font-display font-semibold text-white text-base mb-1">
                      Корзина пуста
                    </p>
                    <p className="text-xs font-mono text-[#717b8a] max-w-xs mb-6">
                      Выберите стильные вещи из каталога и добавьте в корзину для оформления заказа.
                    </p>
                    <button
                      onClick={onClose}
                      className="px-5 py-2.5 rounded-lg bg-[#e2e8f0] text-[#090a0c] font-mono text-xs font-semibold uppercase hover:bg-white transition-all"
                    >
                      Смотреть коллекцию
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {items.map((item) => (
                      <div
                        key={`${item.product.id}-${item.selectedSize}`}
                        className="p-3 rounded-xl bg-[#14161b] border border-[#222731] flex gap-3.5 items-center"
                      >
                        {/* Thumbnail */}
                        <div className="w-16 h-20 rounded-lg overflow-hidden bg-[#0a0b0d] flex-shrink-0 border border-[#222730]">
                          <img
                            src={item.product.images[0] || 'https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=1000'}
                            alt={item.product.title}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-display font-semibold text-xs text-white truncate mb-0.5">
                            {item.product.title}
                          </h4>
                          <div className="flex items-center gap-2 text-[11px] font-mono text-[#8b95a5] mb-2">
                            <span>Размер: <strong className="text-white">{item.selectedSize}</strong></span>
                            <span>•</span>
                            <span className="text-white font-medium">
                              {item.product.price.toLocaleString('ru-RU')} {currency}
                            </span>
                          </div>

                          {/* Stepper */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center rounded-md bg-[#0e1013] border border-[#292f3b] p-0.5">
                              <button
                                onClick={() => {
                                  triggerHaptic('light');
                                  onUpdateQuantity(item.product.id, item.selectedSize, item.quantity - 1);
                                }}
                                className="w-6 h-6 flex items-center justify-center text-[#9ca3af] hover:text-white rounded text-xs"
                              >
                                -
                              </button>
                              <span className="w-6 text-center font-mono text-xs font-semibold text-white">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => {
                                  triggerHaptic('light');
                                  onUpdateQuantity(item.product.id, item.selectedSize, item.quantity + 1);
                                }}
                                className="w-6 h-6 flex items-center justify-center text-[#9ca3af] hover:text-white rounded text-xs"
                              >
                                +
                              </button>
                            </div>

                            <button
                              onClick={() => {
                                triggerHaptic('medium');
                                onRemoveItem(item.product.id, item.selectedSize);
                              }}
                              className="text-[#64748b] hover:text-rose-400 p-1.5 rounded transition-colors"
                              title="Удалить"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {step === 'checkout' && (
              <form id="checkout-form" onSubmit={handleCreateOrder} className="space-y-4">
                <div className="p-3 rounded-lg bg-[#14171d] border border-[#232935] text-xs font-mono text-[#94a3b8]">
                  <div className="flex items-center gap-1.5 text-white font-semibold mb-1">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Безопасная оплата через бота</span>
                  </div>
                  Заказ будет сформирован и передан в Telegram бот @{botUsername}. Вы получите счет на оплату (картой или СБП).
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#9ca3af] uppercase tracking-wider mb-1">
                    Ваше имя *
                  </label>
                  <input
                    type="text"
                    required
                    value={customer.name}
                    onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                    placeholder="Александр"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#121418] border border-[#292f3b] text-white text-sm focus:border-white focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#9ca3af] uppercase tracking-wider mb-1">
                    Telegram @username
                  </label>
                  <input
                    type="text"
                    value={customer.telegramUsername}
                    onChange={(e) => setCustomer({ ...customer, telegramUsername: e.target.value })}
                    placeholder="@username"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#121418] border border-[#292f3b] text-white text-sm focus:border-white focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#9ca3af] uppercase tracking-wider mb-1">
                    Номер телефона *
                  </label>
                  <input
                    type="tel"
                    required
                    value={customer.phone}
                    onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                    placeholder="+7 (999) 000-00-00"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#121418] border border-[#292f3b] text-white text-sm focus:border-white focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#9ca3af] uppercase tracking-wider mb-1">
                    Адрес доставки / Пункт СДЭК
                  </label>
                  <input
                    type="text"
                    value={customer.address}
                    onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                    placeholder="г. Москва, ул. Ленина 10 или пункт СДЭК"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#121418] border border-[#292f3b] text-white text-sm focus:border-white focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#9ca3af] uppercase tracking-wider mb-1">
                    Комментарий к заказу (по желанию)
                  </label>
                  <textarea
                    rows={2}
                    value={customer.comment}
                    onChange={(e) => setCustomer({ ...customer, comment: e.target.value })}
                    placeholder="Пожелания по примерке, времени доставки и т.д."
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#121418] border border-[#292f3b] text-white text-sm focus:border-white focus:outline-none font-mono resize-none"
                  />
                </div>
              </form>
            )}

            {step === 'success' && placedOrder && (
              <div className="space-y-4 py-2 text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-950/40 border border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center">
                  <Check className="w-8 h-8" />
                </div>

                <div>
                  <h3 className="font-display font-bold text-xl text-white">
                    Заказ #{placedOrder.id} успешно создан!
                  </h3>
                  <p className="text-xs font-mono text-[#9ca3af] mt-1">
                    Сумма к оплате: <strong className="text-white">{placedOrder.total.toLocaleString('ru-RU')} {currency}</strong>
                  </p>
                </div>

                {/* Telegram Bot Action */}
                <div className="p-4 rounded-xl bg-[#14171d] border border-[#262c37] text-left space-y-3">
                  <p className="text-xs text-[#cbd5e1] leading-relaxed">
                    Для проведения оплаты и подтверждения доставки перейдите в официальный Telegram бот бренда:
                  </p>

                  <button
                    onClick={handleOpenBot}
                    className="w-full py-3 px-4 rounded-lg bg-[#38bdf8] text-[#082f49] font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-[#7dd3fc] transition-all shadow-[0_0_20px_rgba(56,189,248,0.25)]"
                  >
                    <Send className="w-4 h-4" />
                    <span>Перейти к оплате в @{botUsername}</span>
                  </button>

                  <button
                    onClick={handleCopyOrder}
                    className="w-full py-2.5 px-4 rounded-lg bg-[#1a1d24] border border-[#2d3441] text-xs font-mono text-[#cbd5e1] hover:text-white flex items-center justify-center gap-2 transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Скопировано в буфер!' : 'Скопировать чек заказа'}</span>
                  </button>
                </div>

                <div className="text-[11px] font-mono text-[#64748b]">
                  Информация о заказе также сохранена в системе бренда.
                </div>
              </div>
            )}
          </div>

          {/* Footer actions */}
          {step !== 'success' && items.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-[#21262f] bg-[#111317] space-y-3">
              {/* Summary line */}
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[#8892a0]">Сумма товаров:</span>
                <span className="text-white font-semibold">
                  {total.toLocaleString('ru-RU')} {currency}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[#8892a0]">Доставка:</span>
                <span className="text-emerald-400 font-semibold">БЕСПЛАТНО</span>
              </div>
              <div className="flex items-center justify-between text-sm sm:text-base font-mono font-bold pt-2 border-t border-[#232833]">
                <span className="text-white">Итого к оплате:</span>
                <span className="text-[#f1f5f9]">
                  {total.toLocaleString('ru-RU')} {currency}
                </span>
              </div>

              {/* Main buttons */}
              {step === 'cart' ? (
                <button
                  onClick={() => {
                    triggerHaptic('medium');
                    setStep('checkout');
                  }}
                  className="w-full py-3.5 px-4 rounded-lg bg-[#f1f5f9] text-[#090a0c] font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-white transition-all shadow-[0_0_20px_rgba(241,245,249,0.15)] active:scale-[0.99]"
                >
                  <span>Перейти к оформлению</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setStep('cart')}
                    className="py-3 px-3 rounded-lg bg-[#191c22] border border-[#2c323e] text-xs font-mono text-[#9ca3af] hover:text-white"
                  >
                    Назад
                  </button>
                  <button
                    type="submit"
                    form="checkout-form"
                    className="flex-1 py-3.5 px-4 rounded-lg bg-[#38bdf8] text-[#082f49] font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-[#7dd3fc] transition-all shadow-[0_0_20px_rgba(56,189,248,0.25)]"
                  >
                    <Send className="w-4 h-4" />
                    <span>Оплатить через бота</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
};
