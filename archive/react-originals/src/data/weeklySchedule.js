// 清迈周课程表数据（基于小红书信息模拟）
export const weeklyScheduleData = [
  {
    week: '第1周',
    startDate: '2025-01-27',
    endDate: '2025-02-02',
    activities: [
      {
        id: 101,
        dayOfWeek: 1, // 周一
        title: '流瑜伽基础班',
        description: '适合初学者的流瑜伽课程，帮助提升柔韧性和力量',
        category: '瑜伽',
        time: '09:00-10:30',
        location: '宁曼一号瑜伽馆',
        price: '免费',
        teacher: 'Siri',
        capacity: 15,
        enrolled: 12,
        image: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=400'
      },
      {
        id: 102,
        dayOfWeek: 1,
        title: '冥想入门',
        description: '学习基础冥想技巧，缓解压力，提升专注力',
        category: '冥想',
        time: '14:00-15:30',
        location: '森林寺',
        price: '免费（随喜）',
        teacher: 'Phra Somchai',
        capacity: 30,
        enrolled: 25,
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400'
      },
      {
        id: 103,
        dayOfWeek: 2, // 周二
        title: '泰式烹饪课',
        description: '学习制作冬阴功汤和泰式炒河粉',
        category: '美食体验',
        time: '10:00-12:00',
        location: '宁曼一号烹饪工作室',
        price: '免费',
        teacher: 'Chef Mai',
        capacity: 10,
        enrolled: 8,
        image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=400'
      },
      {
        id: 104,
        dayOfWeek: 3, // 周三
        title: '公园瑜伽晨练',
        description: '在Huay Tung Tao湖畔进行清晨瑜伽',
        category: '瑜伽',
        time: '07:00-08:00',
        location: 'Huay Tung Tao',
        price: '免费',
        teacher: 'Nat',
        capacity: 20,
        enrolled: 18,
        image: 'https://images.unsplash.com/photo-1599447421405-0c2c959289d6?w=400'
      },
      {
        id: 105,
        dayOfWeek: 4, // 周四
        title: '英语口语角',
        description: '免费英语交流活动，提升口语能力',
        category: '其他',
        time: '18:00-19:30',
        location: '清迈大学附近',
        price: '免费',
        teacher: 'Sarah',
        capacity: 15,
        enrolled: 10,
        image: 'https://images.unsplash.com/photo-1523240795612-24a0a9c685b1?w=400'
      },
      {
        id: 106,
        dayOfWeek: 5, // 周五
        title: '手工陶艺课',
        description: '体验泰国传统陶艺制作',
        category: '文化艺术',
        time: '15:00-17:00',
        location: '清迈艺术村',
        price: '免费（材料自理）',
        teacher: 'Ploy',
        capacity: 8,
        enrolled: 6,
        image: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=400'
      },
      {
        id: 107,
        dayOfWeek: 6, // 周六
        title: '徒步山城',
        description: '探索清迈周边山脉，适合所有水平',
        category: '户外探险',
        time: '08:00-12:00',
        location: '素贴山脚下',
        price: '免费',
        teacher: 'Chai',
        capacity: 20,
        enrolled: 15,
        image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400'
      },
      {
        id: 108,
        dayOfWeek: 0, // 周日
        title: '禅修体验',
        description: '全天禅修，体验佛教冥想',
        category: '冥想',
        time: '08:00-17:00',
        location: 'Wat Ram Poeng',
        price: '免费（随喜）',
        teacher: 'Meditation Center',
        capacity: 30,
        enrolled: 28,
        image: 'https://images.unsplash.com/photo-1599447421405-0c2c959289d6?w=400'
      }
    ]
  },
  {
    week: '第2周',
    startDate: '2025-02-03',
    endDate: '2025-02-09',
    activities: [
      {
        id: 201,
        dayOfWeek: 1,
        title: '阴瑜伽',
        description: '深层放松的阴瑜伽练习',
        category: '瑜伽',
        time: '18:00-19:30',
        location: 'One Nimman 瑜伽馆',
        price: '300฿（公益价）',
        teacher: 'Linda',
        capacity: 12,
        enrolled: 10,
        image: 'https://images.unsplash.com/photo-1544363766-0a2df425a6c5?w=400'
      },
      {
        id: 202,
        dayOfWeek: 2,
        title: '泰语基础',
        description: '零基础泰语学习班',
        category: '其他',
        time: '14:00-15:30',
        location: 'One Nimman 学习中心',
        price: '免费',
        teacher: 'Kamon',
        capacity: 15,
        enrolled: 12,
        image: 'https://images.unsplash.com/photo-1523240795612-24a0a9c685b1?w=400'
      },
      {
        id: 203,
        dayOfWeek: 3,
        title: '摄影工作坊',
        description: '学习用手机拍出专业照片',
        category: '文化艺术',
        time: '16:00-18:00',
        location: '清迈摄影俱乐部',
        price: '免费',
        teacher: 'Tom',
        capacity: 12,
        enrolled: 8,
        image: 'https://images.unsplash.com/photo-1452587925148-ce548e8c736b?w=400'
      },
      {
        id: 204,
        dayOfWeek: 4,
        title: '泰式按摩入门',
        description: '学习基础泰式按摩手法',
        category: '文化艺术',
        time: '14:00-16:00',
        location: '清迈按摩学校',
        price: '免费',
        teacher: 'Som',
        capacity: 10,
        enrolled: 9,
        image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400'
      },
      {
        id: 205,
        dayOfWeek: 5,
        title: '免费英语角',
        description: '与母语者练习英语对话',
        category: '其他',
        time: '19:00-20:30',
        location: '咖啡馆',
        price: '免费',
        teacher: 'Volunteer',
        capacity: 12,
        enrolled: 8,
        image: 'https://images.unsplash.com/photo-1523240795612-24a0a9c685b1?w=400'
      },
      {
        id: 206,
        dayOfWeek: 6,
        title: '周末市集',
        description: '逛周末创意市集，发现好物',
        category: '其他',
        time: '17:00-22:00',
        location: 'One Nimman',
        price: '免费',
        teacher: null,
        capacity: null,
        enrolled: null,
        image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400'
      }
    ]
  }
]

export const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

export const getActivitiesByDay = (weekIndex, dayOfWeek) => {
  const week = weeklyScheduleData[weekIndex]
  if (!week) return []
  return week.activities.filter(a => a.dayOfWeek === dayOfWeek)
}
