'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { database } from '@/lib/firebase'
import { ref, onValue, push, set } from 'firebase/database'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { MessageSquare, Plus, Search, Book, Users, Clock } from 'lucide-react'

interface Ticket {
  id: string
  createdBy: string
  customerName: string
  subject: string
  description: string
  status: string
  createdAt: number
  assignedTo?: string
}

interface KnowledgeArticle {
  id: string
  title: string
  content: string
  createdBy: string
  createdAt: number
}

export default function CRMDashboard() {
  const { user, userData, loading, initialized } = useAuth()
  const router = useRouter()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeArticle[]>([])
  const [showCreateArticle, setShowCreateArticle] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [articleForm, setArticleForm] = useState({
    title: '',
    content: ''
  })

  useEffect(() => {
    if (initialized && !loading) {
      if (!user || !userData) {
        router.push('/auth/login')
        return
      }

      // Load tickets
      const ticketsRef = ref(database, 'crm/tickets')
      const unsubscribeTickets = onValue(ticketsRef, (snapshot) => {
        const data = snapshot.val()
        if (data) {
          let ticketsList = Object.entries(data).map(([id, ticket]: [string, any]) => ({ id, ...ticket }))
          
          // Filter tickets based on user role
          if (userData.role === 'customer') {
            ticketsList = ticketsList.filter(ticket => ticket.createdBy === user.uid)
          } else if (userData.role === 'seller') {
            ticketsList = ticketsList.filter(ticket => ticket.assignedTo === user.uid)
          }
          
          setTickets(ticketsList.sort((a, b) => b.createdAt - a.createdAt))
        }
      })

      // Load knowledge base
      const knowledgeRef = ref(database, 'crm/knowledgeBase')
      const unsubscribeKnowledge = onValue(knowledgeRef, (snapshot) => {
        const data = snapshot.val()
        if (data) {
          const articlesList = Object.entries(data).map(([id, article]: [string, any]) => ({ id, ...article }))
          setKnowledgeBase(articlesList.sort((a, b) => b.createdAt - a.createdAt))
        }
      })

      return () => {
        unsubscribeTickets()
        unsubscribeKnowledge()
      }
    }
  }, [user, userData, loading, initialized, router])

  const handleCreateArticle = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || userData?.role !== 'admin') return

    try {
      const knowledgeRef = ref(database, 'crm/knowledgeBase')
      const newArticleRef = push(knowledgeRef)
      
      await set(newArticleRef, {
        title: articleForm.title,
        content: articleForm.content,
        createdBy: user.uid,
        createdAt: Date.now()
      })

      setArticleForm({ title: '', content: '' })
      setShowCreateArticle(false)
    } catch (error) {
      console.error('Error creating article:', error)
    }
  }

  if (loading || !initialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-600"></div>
      </div>
    )
  }

  if (!user || !userData) {
    return null
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-red-100 text-red-800'
      case 'in-progress': return 'bg-yellow-100 text-yellow-800'
      case 'resolved': return 'bg-green-100 text-green-800'
      case 'closed': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredArticles = knowledgeBase.filter(article =>
    article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    article.content.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">CRM Dashboard</h1>
          <p className="text-gray-600">Customer Relationship Management</p>
        </div>

        <Tabs defaultValue="tickets" className="space-y-6">
          <TabsList>
            <TabsTrigger value="tickets">Support Tickets</TabsTrigger>
            <TabsTrigger value="knowledge">Knowledge Base</TabsTrigger>
            {userData.role === 'admin' && <TabsTrigger value="analytics">Analytics</TabsTrigger>}
          </TabsList>

          <TabsContent value="tickets">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2" />
                  Support Tickets
                </CardTitle>
                <CardDescription>
                  {userData.role === 'customer' ? 'Your support tickets' : 
                   userData.role === 'seller' ? 'Assigned tickets' : 'All support tickets'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {tickets.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No tickets found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {tickets.map((ticket) => (
                      <div key={ticket.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium">{ticket.subject}</p>
                            <p className="text-sm text-gray-600">{ticket.customerName}</p>
                            <p className="text-sm text-gray-600">
                              {new Date(ticket.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge className={getStatusColor(ticket.status)}>
                            {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-700 mb-3">{ticket.description}</p>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline">
                            View Details
                          </Button>
                          <Button size="sm" variant="outline">
                            <MessageSquare className="h-4 w-4 mr-1" />
                            Chat
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="knowledge">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center">
                      <Book className="h-5 w-5 mr-2" />
                      Knowledge Base
                    </CardTitle>
                    <CardDescription>Search for help articles and guides</CardDescription>
                  </div>
                  {userData.role === 'admin' && (
                    <Dialog open={showCreateArticle} onOpenChange={setShowCreateArticle}>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="h-4 w-4 mr-2" />
                          Create Article
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Create Knowledge Base Article</DialogTitle>
                          <DialogDescription>
                            Create a helpful article for customers and sellers
                          </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreateArticle} className="space-y-4">
                          <div>
                            <Label htmlFor="title">Article Title</Label>
                            <Input
                              id="title"
                              value={articleForm.title}
                              onChange={(e) => setArticleForm(prev => ({ ...prev, title: e.target.value }))}
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="content">Article Content</Label>
                            <Textarea
                              id="content"
                              value={articleForm.content}
                              onChange={(e) => setArticleForm(prev => ({ ...prev, content: e.target.value }))}
                              rows={10}
                              required
                            />
                          </div>
                          <Button type="submit" className="w-full">
                            Create Article
                          </Button>
                        </form>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search knowledge base..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {filteredArticles.length === 0 ? (
                  <div className="text-center py-8">
                    <Book className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No articles found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredArticles.map((article) => (
                      <div key={article.id} className="border rounded-lg p-4">
                        <h3 className="font-medium mb-2">{article.title}</h3>
                        <p className="text-sm text-gray-700 mb-3 line-clamp-3">
                          {article.content}
                        </p>
                        <div className="flex justify-between items-center">
                          <p className="text-xs text-gray-500">
                            {new Date(article.createdAt).toLocaleDateString()}
                          </p>
                          <Button size="sm" variant="outline">
                            Read More
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {userData.role === 'admin' && (
            <TabsContent value="analytics">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{tickets.length}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {tickets.filter(t => t.status === 'open').length}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Knowledge Articles</CardTitle>
                    <Book className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{knowledgeBase.length}</div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  )
}
