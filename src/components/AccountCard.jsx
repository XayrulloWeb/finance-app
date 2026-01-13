import React from 'react';
import { Wallet, DollarSign, CreditCard, Banknote } from 'lucide-react';

const GRADIENTS = [
  'gradient-blue',
  'gradient-green',
  'gradient-purple',
  'gradient-orange',
  'gradient-pink',
  'gradient-teal'
];

const ICONS = {
  'наличные': Banknote,
  'наличка': Banknote,
  'cash': Banknote,
  'карта': CreditCard,
  'card': CreditCard,
  'uzcard': CreditCard,
  'visa': CreditCard,
  'default': Wallet
};

function getIconComponent(accountName) {
  const lowerName = accountName.toLowerCase();
  for (const [key, Icon] of Object.entries(ICONS)) {
    if (lowerName.includes(key)) return Icon;
  }
  return ICONS.default;
}

function getGradientClass(index) {
  // If account has a specific color, use it as fallback
  // Otherwise use gradient from array
  if (index !== undefined) {
    return GRADIENTS[index % GRADIENTS.length];
  }
  return GRADIENTS[0];
}

export default function AccountCard({ account, balance, index, onClick }) {
  const IconComponent = getIconComponent(account.name);
  const gradientClass = getGradientClass(index);

  return (
      <div
          className={`${gradientClass} p-6 rounded-2xl shadow-lg account-card cursor-pointer animate-fade-in`}
          onClick={onClick}
          style={{ animationDelay: `${index * 0.1}s` }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
            <IconComponent className="text-white" size={24} />
          </div>
          <span className="text-white/80 text-xs font-semibold uppercase tracking-wider">
          {account.currency || 'UZS'}
        </span>
        </div>

        <div className="text-white">
          <div className="text-sm font-medium opacity-90 mb-1">{account.name}</div>
          <div className="text-2xl font-black">
            {new Intl.NumberFormat('uz-UZ').format(balance)}
          </div>
        </div>
      </div>
  );
}