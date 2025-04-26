import React, { useState } from 'react';
import { useSchedulerStatus, useStartScheduler, useStopScheduler, useScheduleHistory } from '../../hooks/useScheduler';
import { Button } from '../ui/button';
import { Loading } from '../ui/loading';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '../ui/table';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import { Separator } from '../ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { iCarbonPlay, iCarbonStop, iCarbonTime } from 'unocss/preset-icons';

interface Schedule {
  id: string;
  name: string;
  cron: string;
  isActive: boolean;
  lastRun: string | null;
  nextRun: string | null;
}

const SchedulerManager: React.FC = () => {
  const { status, isLoading: statusLoading } = useSchedulerStatus();
  const { history, isLoading: historyLoading } = useScheduleHistory();
  const { startScheduler, isLoading: startLoading } = useStartScheduler();
  const { stopScheduler, isLoading: stopLoading } = useStopScheduler();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [newSchedule, setNewSchedule] = useState<Partial<Schedule>>({
    name: '',
    cron: '',
    isActive: true,
  });

  const handleAddSchedule = () => {
    if (newSchedule.name && newSchedule.cron) {
      setSchedules([
        ...schedules,
        {
          id: Date.now().toString(),
          name: newSchedule.name,
          cron: newSchedule.cron,
          isActive: newSchedule.isActive || true,
          lastRun: null,
          nextRun: null,
        },
      ]);
      setNewSchedule({ name: '', cron: '', isActive: true });
    }
  };

  const handleDeleteSchedule = (id: string) => {
    setSchedules(schedules.filter((schedule) => schedule.id !== id));
  };

  const handleToggleSchedule = (id: string) => {
    setSchedules(
      schedules.map((schedule) =>
        schedule.id === id ? { ...schedule, isActive: !schedule.isActive } : schedule
      )
    );
  };

  if (statusLoading || !status) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Scheduler Durumu</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i}>
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-6 w-32" />
                </div>
              ))}
            </div>
            <Separator className="my-4" />
            <div className="flex space-x-4">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-24" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Son Çalışmalar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex space-x-4">
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-40" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <Card className="bg-dark-800 border-dark-700">
          <CardHeader>
            <CardTitle className="text-white">Yeni Zamanlama Ekle</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-white">
                  Zamanlama Adı
                </Label>
                <Input
                  id="name"
                  value={newSchedule.name}
                  onChange={(e) =>
                    setNewSchedule({ ...newSchedule, name: e.target.value })
                  }
                  className="bg-dark-700 border-dark-600 text-white"
                  placeholder="Zamanlama adı"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cron" className="text-white">
                  Cron İfadesi
                </Label>
                <Input
                  id="cron"
                  value={newSchedule.cron}
                  onChange={(e) =>
                    setNewSchedule({ ...newSchedule, cron: e.target.value })
                  }
                  className="bg-dark-700 border-dark-600 text-white"
                  placeholder="* * * * *"
                />
              </div>
            </div>
            <Button
              onClick={handleAddSchedule}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              <i-carbon-time className="mr-2" />
              Zamanlama Ekle
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-dark-800 border-dark-700">
          <CardHeader>
            <CardTitle className="text-white">Mevcut Zamanlamalar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {schedules.map((schedule) => (
                <div
                  key={schedule.id}
                  className="flex items-center justify-between p-4 bg-dark-700 rounded-lg"
                >
                  <div className="space-y-1">
                    <p className="text-white font-medium">{schedule.name}</p>
                    <p className="text-gray-400 text-sm">{schedule.cron}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>Son Çalışma: {schedule.lastRun || 'Henüz çalışmadı'}</span>
                      <span>•</span>
                      <span>Sonraki Çalışma: {schedule.nextRun || 'Bilinmiyor'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleSchedule(schedule.id)}
                      className={`${
                        schedule.isActive
                          ? 'bg-green-500/10 text-green-400'
                          : 'bg-red-500/10 text-red-400'
                      }`}
                    >
                      {schedule.isActive ? (
                        <>
                          <i-carbon-play className="mr-1 h-4 w-4" />
                          Çalışıyor
                        </>
                      ) : (
                        <>
                          <i-carbon-stop className="mr-1 h-4 w-4" />
                          Durduruldu
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteSchedule(schedule.id)}
                      className="text-red-400 hover:bg-red-500/10"
                    >
                      <i-carbon-trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {schedules.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  Henüz zamanlama eklenmemiş
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Scheduler Durumu</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-muted-foreground">Durum</p>
                <p className="font-medium text-card-foreground">
                  <Badge variant={status.is_running ? 'success' : 'error'}>
                    {status.is_running ? 'Çalışıyor' : 'Durduruldu'}
                  </Badge>
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Son Çalışma</p>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <p className="font-medium text-card-foreground cursor-help">
                      {status.last_execution || 'Henüz çalışmadı'}
                    </p>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Son çalışma zamanı</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div>
                <p className="text-muted-foreground">Sonraki Çalışma</p>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <p className="font-medium text-card-foreground cursor-help">
                      {status.next_execution || 'Bilinmiyor'}
                    </p>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Planlanan bir sonraki çalışma zamanı</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div>
                <p className="text-muted-foreground">Aktif Şablonlar</p>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <p className="font-medium text-card-foreground cursor-help">
                      {status.active_templates} / {status.total_templates}
                    </p>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Aktif şablon sayısı / Toplam şablon sayısı</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
            <Separator className="my-4" />
            <div className="flex space-x-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button
                      onClick={startScheduler}
                      disabled={status.is_running || startLoading}
                      variant="default"
                      className="w-24"
                    >
                      {startLoading ? <Loading /> : 'Başlat'}
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Scheduler'ı başlat</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button
                      onClick={stopScheduler}
                      disabled={!status.is_running || stopLoading}
                      variant="destructive"
                      className="w-24"
                    >
                      {stopLoading ? <Loading /> : 'Durdur'}
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Scheduler'ı durdur</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Son Çalışmalar</CardTitle>
          </CardHeader>
          <CardContent>
            {historyLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex space-x-4">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-6 w-40" />
                  </div>
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Şablon ID</TableHead>
                    <TableHead>Çalışma Zamanı</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead>Hata Mesajı</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-help">{item.template_id}</span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Şablon ID: {item.template_id}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell>{item.execution_time}</TableCell>
                      <TableCell>
                        <Badge variant={item.status === 'success' ? 'success' : 'error'}>
                          {item.status === 'success' ? 'Başarılı' : 'Başarısız'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {item.error_message ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-help text-destructive">
                                {item.error_message}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Hata detayı: {item.error_message}</p>
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
};

export default SchedulerManager; 