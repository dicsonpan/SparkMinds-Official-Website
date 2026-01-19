import { CourseLevel, Showcase, PhilosophyPoint } from './types';

export const CURRICULUM: CourseLevel[] = [
  {
    id: 'L1',
    level: 'LEVEL 1 (6-7岁)',
    age: '空间构建与数字化启蒙',
    title: '小小造物主 · 3D设计与实体化',
    description: '不只是玩积木，而是像设计师一样思考。孩子将学习将脑海中的奇思妙想，通过TinkerCad进行3D建模，并亲手操作3D打印机将其变为现实，建立早期的空间想象力与工程概念。',
    skills: ['空间想象力', '3D建模', '逆向工程思维', '动手实践'],
    iconName: 'Box'
  },
  {
    id: 'L2',
    level: 'LEVEL 2 (7-8岁)',
    age: '物理感知与电子科学',
    title: '科学发明家 · 电子电路入门',
    description: '探索“电”的魔法。通过制作声光电小发明（如自制台灯、感应风扇），理解电路原理与传感器逻辑。从这一步开始，孩子不再是电子产品的消费者，而是创造者。',
    skills: ['电路原理', '传感器应用', '科学探究', '逻辑归因'],
    iconName: 'Zap'
  },
  {
    id: 'L3',
    level: 'LEVEL 3 (9-10岁)',
    age: '计算思维与逻辑构建',
    title: '逻辑交互 · 图形化编程进阶',
    description: '编程语言的“看图说话”。使用Mixly等工具，让硬件“活”起来（如设计点阵动画、智能温控）。重点培养计算机科学核心的“输入-处理-输出”逻辑思维，为代码编程打下地基。',
    skills: ['计算思维', '流程图逻辑', '模块化设计', '软硬结合'],
    iconName: 'MousePointerClick'
  },
  {
    id: 'L4',
    level: 'LEVEL 4 (10-11岁)',
    age: '代码进阶与自动化控制',
    title: '极客工程师 · C++与自动化',
    description: '告别图形块，开始像真正的工程师一样敲代码。学习C++语言与Arduino主板，通过制作循迹小车、智能家居原型，掌握计算机底层的控制逻辑与算法基础。',
    skills: ['C++语言', '算法基础', '自动化控制', 'Debug能力'],
    iconName: 'Cpu'
  },
  {
    id: 'L5',
    level: 'LEVEL 5 (11-13岁)',
    age: '万物互联与系统工程',
    title: '全栈初阶 · 物联网(IoT)系统',
    description: '从单机到联网的跨越。学习如何用手机远程控制硬件（如远程浇花系统）。孩子将接触Python语言，理解现代互联网设备是如何交互的，培养系统性的工程视野。',
    skills: ['Python/C++', '网络通信', '系统架构', '复杂工程管理'],
    iconName: 'Wifi'
  },
  {
    id: 'L6',
    level: 'LEVEL 6 (13-15岁)',
    age: '互联网产品开发实战',
    title: '全栈高阶 · 独立开发与部署',
    description: '具备独立开发商业级产品的能力。学习Linux服务器、数据库与网页技术。孩子将能独立搭建网站、开发小程序，打通软件与硬件的最后“一公里”。',
    skills: ['Linux服务器', 'Web全栈', '数据库', '产品经理思维'],
    iconName: 'Globe'
  },
  {
    id: 'L7',
    level: 'LEVEL 7 (15-18岁)',
    age: '前沿科技与学术科研',
    title: 'AI科学家 · 人工智能与科研',
    description: '站在科技的最前沿。接触计算机视觉、神经网络等大学级知识。我们将指导学生进行独立课题研究，产出高含金量的科研论文或项目，助力国内外名校申请。',
    skills: ['AI/深度学习', '学术写作', '科研方法论', '名校背景提升'],
    iconName: 'Brain'
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
    imageAlt: 'Screenshot of HouLang Cloud platform interface'
  },
  {
    title: '智能乐谱阅读器',
    category: '国际大奖作品',
    description: '源于对音乐的热爱，孩子结合物联网技术解决了“翻谱难”的痛点。该项目跨越3年持续迭代，斩获多项国际科创大奖，成为名校申请的强力敲门砖。',
    imageAlt: 'Student presenting electronic sheet music device'
  },
  {
    title: '医用矫正护具',
    category: '跨学科应用',
    description: '通过3D扫描与人体工学设计，为患者定制低成本、高透气的康复护具。这是科技与人文关怀的完美结合，体现了孩子用技术改变生活的社会责任感。',
    imageAlt: '3D printed yellow arm guard structure'
  },
  {
    title: '田野密码 · 智慧农业',
    category: 'PBL项目式学习',
    description: '走出教室，走进田野。孩子们通过实地调研，设计了一套全自动灌溉系统。在解决真实农业问题的过程中，他们理解了什么是工程，什么是责任。',
    imageAlt: 'Students in field testing irrigation system'
  }
];