// src/components/dashboard/sidebar.tsx
"use client";

import React, { FC, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import {
  ChevronDown,
  ChevronRight,
  CreditCard,
  Users,
  Building,
  LogOut,
  MessageSquareText,
  ChartPie,
  ClipboardList,
  KeyRound,
  LayoutGrid,
  WholeWordIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import {
  selectAuthUser,
  logout as logoutAction,
} from "@/features/auth/authSlice";

const BUSINESSES_KEY = "commentius_businesses";
const SELECTED_BUSINESS_ID_KEY = "selected_business_id";

type MenuItem = {
  key: string;
  title: string;
  href?: string;
  icon: React.ReactNode;
  role?: string[];
  submenu?: MenuItem[];
};

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: FC<SidebarProps> = ({ isOpen, onClose }) => {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectAuthUser);

  // Business select state
  const [businesses, setBusinesses] = useState<{ id: number; name: string }[]>(
    [],
  );
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>("");

  // Load businesses from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(BUSINESSES_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setBusinesses(parsed);
          // Set selected from localStorage or default to first
          const sel = localStorage.getItem(SELECTED_BUSINESS_ID_KEY);
          if (
            sel &&
            (parsed as { id: number; name: string }[]).some(
              (b) => String(b.id) === sel,
            )
          ) {
            setSelectedBusinessId(sel);
          } else if (parsed.length > 0) {
            setSelectedBusinessId(String(parsed[0].id));
            localStorage.setItem(
              SELECTED_BUSINESS_ID_KEY,
              String(parsed[0].id),
            );
          }
        } catch {}
      }
    }
  }, []);

  // Handle select change
  const handleBusinessChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedBusinessId(e.target.value);
    if (typeof window !== "undefined") {
      localStorage.setItem(SELECTED_BUSINESS_ID_KEY, e.target.value);
      window.location.reload(); // Sayfayı yenile!
    }
  };

  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    business: true,
  });
  const toggleMenu = (key: string) =>
    setOpenMenus((prev) => ({ ...prev, [key]: !prev[key] }));

  const menuItems: MenuItem[] = [
    {
      key: "business",
      title: "İşletme",
      icon: <Building className="h-5 w-5" />,
      role: ["BUSINESS"],
      submenu: [
        {
          key: "business-dashboard",
          title: "Dashboard",
          href: "/dashboard/business",
          icon: <ChartPie className="h-5 w-5" />,
          role: ["BUSINESS"],
        },
        {
          key: "business-reports",
          title: "Raporlar",
          href: "/dashboard/reports",
          icon: <ClipboardList className="h-5 w-5" />,
          role: ["BUSINESS"],
        },
        {
          key: "business-cards",
          title: "Kartlarım",
          href: "/dashboard/kartlarim",
          icon: <CreditCard className="h-5 w-5" />,
          role: ["BUSINESS"],
        },
        {
          key: "business-reviews",
          title: "Yorumlar",
          href: "/dashboard/reviews",
          icon: <MessageSquareText className="h-5 w-5" />,
          role: ["BUSINESS"],
        },
        {
          key: "business-categories",
          title: "Kategoriler",
          href: "/dashboard/categories",
          icon: <LayoutGrid className="h-5 w-5" />,
          role: ["BUSINESS"],
        },
        {
          key: "business-aspects",
          title: "Etiketler",
          href: "/dashboard/aspect",
          icon: <WholeWordIcon className="h-5 w-5" />,
          role: ["BUSINESS"],
        },
      ],
    },
    {
      key: "settings", // ⬅️ openMenus’daki anahtar
      title: "Ayarlar",
      icon: <KeyRound className="h-5 w-5" />,
      role: ["BUSINESS"],
      submenu: [
        {
          key: "settings-general",
          title: "İşletme Ayarları",
          href: "/dashboard/settings", // ⬅️ istenen rota
          icon: <KeyRound className="h-5 w-5" />,
          role: ["BUSINESS"],
        },
        // Daha sonra başka ayarlar eklemek isterseniz buraya ekleyin
      ],
    },
    {
      key: "admin",
      title: "Admin",
      icon: <Users className="h-5 w-5" />,
      role: ["ADMIN"],
      submenu: [
        {
          key: "admin-accounts",
          title: "İşletme Yönetimi",
          href: "/dashboard/hesap-yonetimi",
          icon: <Users className="h-5 w-5" />,
          role: ["ADMIN"],
        },
        {
          key: "admin-cards",
          title: "Kart Yönetimi",
          href: "/dashboard/kart-yonetimi",
          icon: <CreditCard className="h-5 w-5" />,
          role: ["ADMIN"],
        },
        {
          key: "admin-keys",
          title: "API Anahtarları",
          href: "/dashboard/api-anahtarlari",
          icon: <KeyRound className="h-5 w-5" />,
          role: ["ADMIN"],
        },
      ],
    },
  ];

  const filteredMenu = menuItems.filter((mi) => {
    if (!user) return false;
    const role = user.role?.toUpperCase() ?? "";
    if (role === "ADMIN") return mi.key === "admin";
    return !mi.role || mi.role.includes(role);
  });

  const handleLogout = () => {
    dispatch(logoutAction());
    router.replace("/login");
  };

  if (!user) return null;

  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-40 w-64
        transform transition-transform duration-200
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0 lg:static lg:shadow-none
      `}
    >
      <div className="sticky top-0 h-screen overflow-y-auto bg-background border-r">
        {/* Mobile close */}
        <div className="flex justify-end p-2 lg:hidden">
          <button onClick={onClose} className="p-2 text-gray-600">
            ✕
          </button>
        </div>

        {/* Header */}
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold">Commentius</h2>
          <p className="text-sm text-gray-500">Yönetim Paneli</p>
          {/* Business Select */}
          {businesses.length > 0 && (
            <div className="mt-3">
              <label
                htmlFor="business-select"
                className="block text-xs text-gray-500 mb-1"
              >
                İşletme Seç
              </label>
              <select
                id="business-select"
                className="w-full border rounded px-2 py-1 text-sm"
                value={selectedBusinessId}
                onChange={handleBusinessChange}
              >
                {businesses.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Menu */}
        <div className="p-4">
          {filteredMenu.map((group) => (
            <div key={group.key} className="mb-2">
              <button
                onClick={() => group.submenu && toggleMenu(group.key)}
                className="w-full flex items-center justify-between p-2 rounded hover:bg-gray-100"
              >
                <span className="flex items-center gap-2">
                  {group.icon}
                  {group.title}
                </span>
                {group.submenu &&
                  (openMenus[group.key] ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  ))}
              </button>
              {group.submenu && openMenus[group.key] && (
                <div className="ml-6 mt-1 space-y-1">
                  {group.submenu
                    .filter((sm) => {
                      const role = user.role?.toUpperCase() ?? "";
                      return !sm.role || sm.role.includes(role);
                    })
                    .map((sm) => (
                      <Link
                        key={sm.key}
                        href={sm.href ?? "#"}
                        className={`flex items-center gap-2 p-2 rounded hover:bg-gray-100 ${
                          pathname === sm.href ? "bg-blue-50 text-blue-600" : ""
                        }`}
                      >
                        {sm.icon}
                        {sm.title}
                      </Link>
                    ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* User / Logout */}
        <div className="absolute bottom-0 w-full p-4 border-t lg:static">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
              {user.email?.[0]?.toUpperCase() ?? "U"}
            </div>
            <div>
              <p className="font-medium">{user.email}</p>
              <p className="text-xs text-gray-500 inline-flex items-center gap-1">
                Kredi:
                <Image
                  src="/images/ai.svg"
                  alt="AI ikonu"
                  width={14}
                  height={14}
                />
                {user.reviewReplyTokens}
              </p>
              <p className="text-xs text-gray-500">
                {user.role?.toUpperCase()}
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full flex items-center justify-center gap-2"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Çıkış Yap
          </Button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
