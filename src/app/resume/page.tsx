import { Button } from "@/components/ui/button"
import { Download, Mail, Phone, MapPin } from "lucide-react"

export default function ResumePage() {
  return (
    <div className="container mx-auto px-4 py-10 md:py-16">
      <div className="max-w-4xl mx-auto bg-card border rounded-2xl shadow-sm overflow-hidden">
        <div className="bg-primary p-6 sm:p-8 md:p-12 text-primary-foreground">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">张三 (Zhang San)</h1>
              <p className="text-lg md:text-xl opacity-90 mt-2">高级前端开发工程师</p>
            </div>
            <Button variant="secondary" className="gap-2 w-full md:w-auto h-11">
              <Download className="h-4 w-4" /> 下载简历 (PDF)
            </Button>
          </div>
        </div>
        
        <div className="p-6 sm:p-8 md:p-12 grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          <div className="md:col-span-1 space-y-6 md:space-y-8">
            <div>
              <h3 className="text-lg font-bold border-b pb-2 mb-4">联系方式</h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-3 text-muted-foreground overflow-hidden">
                  <Mail className="h-4 w-4 text-primary shrink-0" /> 
                  <span className="truncate">zhangsan@example.com</span>
                </li>
                <li className="flex items-center gap-3 text-muted-foreground">
                  <Phone className="h-4 w-4 text-primary shrink-0" /> +86 123-4567-8901
                </li>
                <li className="flex items-center gap-3 text-muted-foreground">
                  <MapPin className="h-4 w-4 text-primary shrink-0" /> 北京, 中国
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-bold border-b pb-2 mb-4">核心技能</h3>
              <div className="flex flex-wrap gap-2">
                {['Next.js', 'React', 'TypeScript', 'Tailwind', 'Zustand', 'Node.js'].map(skill => (
                  <span key={skill} className="px-3 py-1 bg-primary/10 text-primary text-[10px] sm:text-xs font-medium rounded-full">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
          
          <div className="md:col-span-2 space-y-6 md:space-y-8">
            <div>
              <h3 className="text-lg font-bold border-b pb-2 mb-4 text-primary">工作经历</h3>
              <div className="space-y-6">
                <div>
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-1 font-bold">
                    <span>某科技互联网大厂</span>
                    <span className="text-sm font-normal text-muted-foreground italic sm:not-italic">2022 - 至今</span>
                  </div>
                  <p className="text-sm font-medium text-primary mt-1">前端技术负责人</p>
                  <ul className="list-disc list-inside mt-3 text-sm text-muted-foreground space-y-2">
                    <li>负责公司核心业务系统的架构设计与开发</li>
                    <li>提升页面加载速度 40%，优化用户交互体验</li>
                    <li>指导初级工程师，建立前端组件库与规范</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

