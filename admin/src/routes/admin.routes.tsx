import {
    LayoutDashboard,
    ShoppingCart,
    Plus,
    ListIndentIncrease,
    ShoppingBasket,
    ShoppingBag,
    Contact,
    Store,
    Table2,
    TableCellsMerge,
    Factory,
    Boxes,
    Sparkles,
} from "lucide-react";


export type SubItem = {
    name: string;
    nameBn?: string;
    link: string;
    icon: React.ReactNode;
    permission?: string;
};


export type NavItem = {
    name: string;
    nameBn?: string;
    icon: React.ReactNode;
    link?: string;
    subItems?: SubItem[];
    permission?: string;
};




export const AdminRoutes: NavItem[] = [
    { name: "Dashboard", nameBn: "ড্যাশবোর্ড", icon: <LayoutDashboard size={18} />, link: "/" },
    { name: "AI Assistant", nameBn: "এআই সহকারী", icon: <Sparkles size={18} />, link: "/ai", permission: "ai:read" },

    {
        name: "Contact",
        nameBn: "যোগাযোগ",
        icon: <Contact size={18} />,
        subItems: [
            {
                name: "Supplier",
                nameBn: "সরবরাহকারী",
                link: "/contact/supplier",
                icon: <Factory size={16} />,
                permission: "contact:read",
            },
        ],
    },
    {
        name: "Product",
        nameBn: "পণ্য",
        icon: <Boxes size={18} />,
        subItems: [
            {
                name: "New Product",
                nameBn: "নতুন পণ্য",
                link: "/product/new",
                icon: <Plus size={16} />,
                permission: "product:create",
            },
            {
                name: "Product List",
                nameBn: "পণ্য তালিকা",
                link: "/product/list",
                icon: <ListIndentIncrease size={16} />,
                permission: "product:read",
            },
        ],
    },
    {
        name: "Purchase",
        nameBn: "ক্রয়",
        icon: <ShoppingBag size={18} />,
        subItems: [
            {
                name: "New Purchase",
                nameBn: "নতুন ক্রয়",
                link: "/purchase/new",
                icon: <ShoppingBasket size={16} />,
                permission: "purchase:create",
            },
            {
                name: "Purchase List",
                nameBn: "ক্রয় তালিকা",
                link: "/purchase/list",
                icon: <Table2 size={16} />,
                permission: "purchase:read",
            },
        ],
    },
    {
        name: "Sale",
        nameBn: "বিক্রয়",
        icon: <ShoppingCart size={18} />,
        subItems: [
            {
                name: "New Sale",
                nameBn: "নতুন বিক্রয়",
                link: "/sale/new",
                icon: <Store size={16} />,
                permission: "sale:create",
            },
            {
                name: "Sale List",
                nameBn: "বিক্রয় তালিকা",
                link: "/sale/list",
                icon: <TableCellsMerge size={16} />,
                permission: "sale:read",
            },
        ],
    },
];
