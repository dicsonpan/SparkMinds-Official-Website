import { CourseLevel, Showcase, PhilosophyPoint, PageSection, SocialProject } from './types';

export const CURRICULUM: CourseLevel[] = [
  {
    id: 'L1',
    level: 'LEVEL 1 (6-7岁)',
    age: '空间构建与数字化启蒙',
    title: '小小造物主 · 3D设计与实体化',
    description: '不只是玩积木，而是像设计师一样思考。孩子将学习将脑海中的奇思妙想，通过TinkerCad进行3D建模，并亲手操作3D打印机将其变为现实，建立早期的空间想象力与工程概念。',
    skills: ['空间想象力', '3D建模', '逆向工程思维', '动手实践'],
    iconName: 'Box',
    imageUrls: [
      'https://images.unsplash.com/photo-1631541909061-71e349d1f203?q=80&w=800&auto=format&fit=crop'
    ]
  },
  {
    id: 'L2',
    level: 'LEVEL 2 (7-8岁)',
    age: '物理感知与电子科学',
    title: '科学发明家 · 电子电路入门',
    description: '探索“电”的魔法。通过制作声光电小发明（如自制台灯、感应风扇），理解电路原理与传感器逻辑。从这一步开始，孩子不再是电子产品的消费者，而是创造者。',
    skills: ['电路原理', '传感器应用', '科学探究', '逻辑归因'],
    iconName: 'Zap',
    imageUrls: [
      'https://images.unsplash.com/photo-1555679427-1f6dfcce943b?q=80&w=800&auto=format&fit=crop'
    ]
  },
  {
    id: 'L3',
    level: 'LEVEL 3 (9-10岁)',
    age: '计算思维与逻辑构建',
    title: '逻辑交互 · 图形化编程进阶',
    description: '编程语言的“看图说话”。使用Mixly等工具，让硬件“活”起来（如设计点阵动画、智能温控）。重点培养计算机科学核心的“输入-处理-输出”逻辑思维，为代码编程打下地基。',
    skills: ['计算思维', '流程图逻辑', '模块化设计', '软硬结合'],
    iconName: 'MousePointerClick',
    imageUrls: [
      'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?q=80&w=800&auto=format&fit=crop'
    ]
  },
  {
    id: 'L4',
    level: 'LEVEL 4 (10-11岁)',
    age: '代码进阶与自动化控制',
    title: '极客工程师 · C++与自动化',
    description: '告别图形块，开始像真正的工程师一样敲代码。学习C++语言与Arduino主板，通过制作循迹小车、智能家居原型，掌握计算机底层的控制逻辑与算法基础。',
    skills: ['C++语言', '算法基础', '自动化控制', 'Debug能力'],
    iconName: 'Cpu',
    imageUrls: [
      'https://images.unsplash.com/photo-1553406830-ef2513450d76?q=80&w=800&auto=format&fit=crop'
    ]
  },
  {
    id: 'L5',
    level: 'LEVEL 5 (11-13岁)',
    age: '万物互联与系统工程',
    title: '全栈初阶 · 物联网(IoT)系统',
    description: '从单机到联网的跨越。学习如何用手机远程控制硬件（如远程浇花系统）。孩子将接触Python语言，理解现代互联网设备是如何交互的，培养系统性的工程视野。',
    skills: ['Python/C++', '网络通信', '系统架构', '复杂工程管理'],
    iconName: 'Wifi',
    imageUrls: [
      'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=800&auto=format&fit=crop'
    ]
  },
  {
    id: 'L6',
    level: 'LEVEL 6 (13-15岁)',
    age: '互联网产品开发实战',
    title: '全栈高阶 · 独立开发与部署',
    description: '具备独立开发商业级产品的能力。学习Linux服务器、数据库与网页技术。孩子将能独立搭建网站、开发小程序，打通软件与硬件的最后“一公里”。',
    skills: ['Linux服务器', 'Web全栈', '数据库', '产品经理思维'],
    iconName: 'Globe',
    imageUrls: [
      'https://images.unsplash.com/photo-1504639725590-34d0984388bd?q=80&w=800&auto=format&fit=crop'
    ]
  },
  {
    id: 'L7',
    level: 'LEVEL 7 (15-18岁)',
    age: '前沿科技与学术科研',
    title: 'AI科学家 · 人工智能与科研',
    description: '站在科技的最前沿。接触计算机视觉、神经网络等大学级知识。我们将指导学生进行独立课题研究，产出高含金量的科研论文或项目，助力国内外名校申请。',
    skills: ['AI/深度学习', '学术写作', '科研方法论', '名校背景提升'],
    iconName: 'Brain',
    imageUrls: [
      'https://images.unsplash.com/photo-1507146426996-ef05306b995a?q=80&w=800&auto=format&fit=crop'
    ]
  }
];

export const PHILOSOPHY: PhilosophyPoint[] = [
  {
    title: '是“真做”，不是“过家家”',
    content: '市面上很多课程只是让孩子拼拼凑凑。我们坚持“全流程真做”——从设计电路板、写代码到外壳建模，让孩子掌握真正解决问题的硬核能力，而非仅仅体验乐趣。',
    iconName: 'Hammer'
  },
  {
    title: '不仅教技术，更懂教育',
    content: '我们拒绝焦虑式的填鸭教育。每个孩子都有自己的花期，我们提供个性化的成长路径，保护孩子的好奇心，让科技成为他们探索世界的工具，而不是枯燥的学科。',
    iconName: 'Sprout'
  },
  {
    title: '做孩子身边的“科技导师”',
    content: '我们的老师不仅是讲师，更是孩子科研路上的引路人（Mentor）。从Debug代码到人生规划，我们提供业内稀缺的深度陪伴，发掘每个孩子独特的闪光点。',
    iconName: 'HeartHandshake'
  }
];

export const SHOWCASES: Showcase[] = [
  {
    title: '厚浪云平台',
    category: '商业级产品',
    description: '一名中学生不仅学会了编程，还创办了自己的云服务平台。这证明了我们的学员具备将技术转化为产品的实战能力，并在真实的商业世界中获得了天使投资。',
    imageUrls: ['Screenshot of HouLang Cloud platform interface']
  },
  {
    title: '智能乐谱阅读器',
    category: '国际大奖作品',
    description: '源于对音乐的热爱，孩子结合物联网技术解决了“翻谱难”的痛点。该项目跨越3年持续迭代，斩获多项国际科创大奖，成为名校申请的强力敲门砖。',
    imageUrls: ['Student presenting electronic sheet music device']
  },
  {
    title: '医用矫正护具',
    category: '跨学科应用',
    description: '通过3D扫描与人体工学设计，为患者定制低成本、高透气的康复护具。这是科技与人文关怀的完美结合，体现了孩子用技术改变生活的社会责任感。',
    imageUrls: ['3D printed yellow arm guard structure']
  },
  {
    title: '田野密码 · 智慧农业',
    category: 'PBL项目式学习',
    description: '走出教室，走进田野。孩子们通过实地调研，设计了一套全自动灌溉系统。在解决真实农业问题的过程中，他们理解了什么是工程，什么是责任。',
    imageUrls: ['Students in field testing irrigation system']
  }
];

export const SOCIAL_PROJECTS: SocialProject[] = [
  {
    title: '学员项目商业化案例',
    subtitle: '市场验证与价值回馈',
    quote: '“这不仅仅是一次售卖，更是孩子建立自信、理解社会价值的最好一课。”',
    footerNote: '* 部分优秀学员作品已成功上线创客市场'
  },
  {
    title: '开源硬件套件众筹',
    subtitle: '从原型到量产',
    quote: '“看着自己设计的电路板被发往全球各地的创客手中，那种成就感比考满分更强烈。”',
    footerNote: '* 学员发起的Kickstarter众筹项目'
  },
  {
    title: '校园智能回收站',
    subtitle: '服务社区',
    quote: '“我们用技术解决了学校垃圾分类的难题，校长甚至为我们颁发了特别贡献奖。”',
    footerNote: '* 项目已在3所合作学校落地运行'
  }
];

export const PAGE_SECTIONS_DEFAULT: PageSection[] = [
  {
    id: 'hero',
    title: '给孩子带得走的',
    description: '在这个人工智能时代，我们不仅教授编程与硬件，更致力于培养孩子解决复杂问题的工程思维。从激发好奇心到顶尖名校科研背景，为未来做好准备。',
    metadata: {
      highlighted_text: '硬核科技创造力',
      cta1: '查看孩子的成长规划',
      cta2: '看看学员们做出了什么'
    }
  },
  {
    id: 'philosophy',
    title: '不仅是兴趣班，更是未来竞争力的孵化器',
    subtitle: 'OUR MISSION',
    description: '我们用6年时间打磨出一套标准化的“真做”课程，让科技素养成为孩子受益终身的能力。'
  },
  {
    id: 'curriculum',
    title: 'L1-L7 阶梯式成长体系',
    subtitle: 'GROWTH PATH',
    description: '科学规划7级成长阶梯，匹配孩子不同年龄段的认知发展。从动手启蒙到算法科研，直通顶尖学府。'
  },
  {
    id: 'showcases',
    title: '让孩子的才华被世界看见',
    subtitle: 'SUCCESS STORIES',
    description: '在创智实验室，没有“死记硬背”的知识。每一个项目都是为了解决真实世界的问题而生，成为孩子简历上最亮眼的勋章。'
  },
  {
    id: 'social_practice',
    title: '让创意的价值\n在真实市场中得到验证',
    subtitle: '社会实践与财商启蒙',
    description: '我们鼓励孩子将作品产品化。通过将创意转化为开源硬件套件或服务，孩子不仅能获得人生“第一桶金”，更重要的是在这一过程中理解经济运行的规律，培养极其宝贵的企业家精神。',
    metadata: {
      list_items: [
        '从Idea到产品的全流程体验',
        '理解成本、定价与市场需求',
        '提前积累真实的社会实践履历'
      ]
    }
  },
  {
    id: 'booking',
    title: '预约体验课', 
    subtitle: 'BOOK NOW',
    description: '请留下您的联系方式，我们的课程顾问将在24小时内与您联系，为您安排个性化试听体验。',
    metadata: {
      nav_button_text: '预约试听',
      mobile_button_text: '预约体验课',
      submit_button_text: '立即预约',
      success_message: '预约成功！我们会尽快联系您。'
    }
  },
  {
    id: 'footer',
    title: '联系我们',
    description: '创智实验室 (SparkMinds) 专注于青少年硬核科技素养教育。\n\n我们致力于为中国家庭提供一条科学、扎实、具有国际视野的科技创新成长路径。',
    metadata: {
      address: '广州/深圳 线下创新中心',
      email: 'contact@sparkminds.edu',
      phone: '400-123-4567',
      copyright: '© 2024 SparkMinds 创智实验室. All rights reserved.',
      explore_title: '探索',
      contact_title: '联系我们'
    }
  }
];