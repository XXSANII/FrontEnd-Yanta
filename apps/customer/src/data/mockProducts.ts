import type { Category, Product } from '../types'

const p = (
  id: string,
  categoryId: string,
  name: string,
  description: string,
  price: number,
  image: string | null,
  isAvailable = true,
): Product => ({
  id,
  category: categoryId,
  name,
  description,
  price,
  image_url: image ? `/images/${image}` : null,
  is_available: isAvailable,
  option_groups: [],
})

export const MOCK_CATEGORIES: Category[] = [
  { id: 'congee', name: 'ข้าวต้ม' },
  { id: 'breakfast', name: 'อาหารเช้า' },
  { id: 'milk-tea', name: 'ชา นม และโกโก้' },
  { id: 'coffee', name: 'กาแฟ' },
]

// ข้อมูลตัวอย่างสำหรับ mock mode (เมื่อยังไม่ได้ตั้งค่า Supabase)
export const MOCK_PRODUCTS: Product[] = [
  p('c1', 'congee', 'ข้าวต้มหมูสับ', 'ข้าวต้มร้อนๆ หมูสับนุ่ม โรยต้นหอมและผักชี', 50, 'congee-pork.jpg'),
  p('c2', 'congee', 'ข้าวต้มเห็ดหอมซี่โครง', 'ซี่โครงหมูตุ๋นนุ่ม เห็ดหอมหอมๆ', 65, 'congee-mushroom.jpg'),
  p('c3', 'congee', 'ข้าวต้มกุ้ง', 'กุ้งสดตัวโต น้ำซุปหวานจากกุ้ง', 70, 'congee-shrimp.jpg'),
  p('c4', 'congee', 'ข้าวต้มปลา', 'เนื้อปลาสด ขิงซอย กระเทียมเจียว', 60, 'congee-fish.jpg'),
  p('b1', 'breakfast', 'ไข่ดาวชุดเช้า', 'ไข่ดาว 2 ฟอง ผักสด ปลาทอด', 55, 'breakfast-eggs.jpg'),
  p('b2', 'breakfast', 'สลัดไก่ทอดไข่ต้ม', 'ผักสลัด ไก่ทอด ไข่ต้ม ข้าวโพด ฟักทอง', 79, 'breakfast-salad.jpg'),
  p('b3', 'breakfast', 'ขนมจีบหมู', 'ขนมจีบนึ่งร้อนๆ 4 ชิ้น', 45, 'breakfast-siumai.jpg'),
  p('b4', 'breakfast', 'ขนมห่อใบตอง', 'ขนมไทยห่อใบตองหอมๆ', 35, 'breakfast-leaf-snack.jpg', false),
  p('m1', 'milk-tea', 'ชาไทยเย็น', 'ชาไทยหวานมัน เย็นชื่นใจ', 40, 'thai-tea.jpg'),
  p('m2', 'milk-tea', 'ชาเขียวนมเย็น', 'ชาเขียวมัทฉะ นมสด', 45, 'green-tea-milk.jpg'),
  p('m3', 'milk-tea', 'นมชมพูเย็น', 'นมเย็นกลิ่นหอมหวาน', 35, 'pink-milk.jpg'),
  p('m4', 'milk-tea', 'โกโก้เย็น', 'โกโก้เข้มข้น เย็นฉ่ำ', 45, 'iced-cocoa.jpg'),
  p('m5', 'milk-tea', 'โกโก้ร้อน', 'โกโก้ร้อน หอมมัน', 40, 'hot-cocoa.jpg'),
  p('m6', 'milk-tea', 'ชามะนาว', 'ชาดำมะนาวสด เปรี้ยวหวานกำลังดี', 35, 'lemon-tea.jpg'),
  p('k1', 'coffee', 'กาแฟโบราณ', 'กาแฟดำชงถุงแบบดั้งเดิม', 35, 'coffee-traditional.jpg'),
  p('k2', 'coffee', 'เอสเปรสโซ', 'เข้มข้น หอมกรุ่น', 45, 'espresso.jpg'),
  p('k3', 'coffee', 'อเมริกาโน่', 'กาแฟดำสไตล์อเมริกัน', 50, 'americano.jpg'),
  p('k4', 'coffee', 'ลาเต้', 'เอสเปรสโซผสมนมสตรีมนุ่มๆ', 60, 'latte.jpg'),
]
