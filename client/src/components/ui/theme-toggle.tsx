import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useTheme } from '@/contexts/ThemeContext';
import { Monitor, Moon, Sun } from 'lucide-react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="icon" 
          className="relative border-blue-200 hover:border-blue-300 hover:bg-blue-50 dark:border-gray-700 dark:hover:border-gray-600 dark:hover:bg-gray-800 transition-colors"
        >
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-blue-600 dark:text-blue-400" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-blue-600 dark:text-blue-400" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="border-blue-200 dark:border-gray-700 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm">
        <DropdownMenuItem 
          onClick={() => setTheme('light')} 
          className="flex items-center gap-2 hover:bg-blue-50 dark:hover:bg-gray-800 focus:bg-blue-50 dark:focus:bg-gray-800"
        >
          <Sun className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <span>Light</span>
          {theme === 'light' && <span className="ml-auto text-blue-600 dark:text-blue-400">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme('dark')} 
          className="flex items-center gap-2 hover:bg-blue-50 dark:hover:bg-gray-800 focus:bg-blue-50 dark:focus:bg-gray-800"
        >
          <Moon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <span>Dark</span>
          {theme === 'dark' && <span className="ml-auto text-blue-600 dark:text-blue-400">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme('system')} 
          className="flex items-center gap-2 hover:bg-blue-50 dark:hover:bg-gray-800 focus:bg-blue-50 dark:focus:bg-gray-800"
        >
          <Monitor className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <span>System</span>
          {theme === 'system' && <span className="ml-auto text-blue-600 dark:text-blue-400">✓</span>}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
