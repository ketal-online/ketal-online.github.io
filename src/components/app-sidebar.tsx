import * as React from "react"
import { Link } from "react-router-dom"
import { useAuth } from "@/hooks/use-auth"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { LucideBeer, LucideLanguages, LucideSunMoon, LucideUsersRound, LogIn, LogOut, UserPlus } from "lucide-react"

const mainItems = [
  {
    title: "Players' List",
    url: "#",
    icon: LucideUsersRound,
  }
]

const footerItems = [
  {
    title: "Theme Selector",
    url: "#",
    icon: LucideSunMoon,
  },
  {
    title: "Language Selector",
    url: "#",
    icon: LucideLanguages,
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, signOut } = useAuth()

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link to="/">
                <LucideBeer className="!size-5" />
                <span className="text-base font-semibold">Ketal Guinze Making</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent className="flex flex-col gap-2">
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton tooltip={item.title}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarGroup>
          <SidebarGroupLabel>Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {user ? (
                <>
                  <SidebarMenuItem>
                    <div className="px-2 py-1.5 text-sm text-muted-foreground truncate">
                      {user.email}
                    </div>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => signOut()}>
                      <LogOut />
                      <span>Logout</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </>
              ) : (
                <>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link to="/login">
                        <LogIn />
                        <span>Login</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link to="/signup">
                        <UserPlus />
                        <span>Sign Up</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Settings</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {footerItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarFooter>
    </Sidebar>
  )
}
