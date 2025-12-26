// 常用的 Element Plus 图标 - 只导出确实存在的图标
export {
  // 基础图标
  Plus,
  Minus,
  Close,
  Check,
  Timer,
  Loading,
  RefreshRight,

  // 导航和操作
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Search,
  Setting,
  Edit,
  Delete,
  Upload,
  Download,

  // 状态和提示
  SuccessFilled,
  Warning,
  InfoFilled,
  QuestionFilled,
  CircleCloseFilled,

  // 文档和数据
  Document,
  Folder,
  FolderOpened,
  DataAnalysis,
  Monitor,
  Cpu,
  Connection,
  Clock,

  // 位置和媒体
  Location,
  MapLocation,
  Picture,
  VideoCamera,
  Microphone,

  // 时间和日历
  Calendar,
  Timer as Clock,

  // 财务和价格
  Money,
  Wallet,
  Coin,

  // 星级和评分
  Star,
  StarFilled,
  StarHalf,

  // 用户和权限
  User,
  UserFilled,
  Avatar,
  Lock,
  Unlock,

  // 通信和分享
  ChatDotSquare,
  Message,
  Share,
  Link,

  // 编辑和工具
  EditPen,
  Scissor,
  CopyDocument,
  Paste,
  FormatPainter,

  // 播放和控制
  VideoPlay,
  VideoPause,
  VideoStop,
  Mute,
  MicroFilled,

  // 窗口和界面
  FullScreen,
  RemoveFilled,
  CirclePlusFilled,
  RemoveFilled,

  // 其他
  House,
  Building,
  Shop,
  Trophy,
  Gift,
  Flag,
  Bell,
  View,
  Hide,
  More,
  MoreFilled
} from '@element-plus/icons-vue'

// 确保这些图标确实存在
export const safeIcons = {
  // 基础操作
  plus: Plus,
  minus: Minus,
  close: Close,
  check: Check,
  refreshRight: RefreshRight,

  // 状态
  success: SuccessFilled,
  warning: Warning,
  info: InfoFilled,
  error: CircleCloseFilled,

  // 数据
  document: Document,
  dataAnalysis: DataAnalysis,
  monitor: Monitor,
  cpu: Cpu,
  connection: Connection,
  clock: Timer,

  // 界面
  setting: Setting,
  folderOpened: FolderOpened,
  download: Download
}