export interface MenuItemNode {
  id: number;
  parent_id: number | null;
  menu_code: string;
  menu_name: string;
  menu_icon: string | null;
  menu_url: string;
  menu_type: string;
  sort_order: number;
  children: MenuItemNode[];
}

export interface InquiryTypeItem {
  id: number;
  label: string;
  sort_order: number;
}

export interface InquiryRow {
  id: number;
  organization: string;
  contact_name: string;
  phone: string;
  email: string;
  inquiry_type: string;
  message: string;
  status?: string;
  created_at: string;
  admin_reply?: string | null;
  replied_at?: string | null;
}
