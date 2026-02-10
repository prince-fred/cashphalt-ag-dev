'use client'

import { signIn } from '@/actions/auth'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Image from 'next/image'

export default function LoginPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (formData: FormData) => {
        setLoading(true)
        try {
            const result = await signIn(formData)
            if (result?.error) {
                toast.error(result.error)
            } else if (result?.success) {
                toast.success('Signed in successfully')
                router.push('/admin')
                router.refresh()
            }
        } catch (error) {
            console.error('Login error:', error)
            toast.error('An unexpected error occurred')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-lg border border-slate-200">
                <div className="text-center">
                    <div className="relative w-16 h-16 mx-auto mb-4 bg-slate-900 rounded-xl flex items-center justify-center">
                        <Image
                            src="/cashphalt-logo.svg"
                            alt="Cashphalt Logo"
                            width={40}
                            height={40}
                            className="object-contain"
                        />
                    </div>
                    <h2 className="mt-6 text-3xl font-bold text-slate-900">Sign in to your account</h2>
                    <p className="mt-2 text-sm text-slate-600">
                        Or contact your administrator if you don't have an account
                    </p>
                </div>
                <form className="mt-8 space-y-6" action={handleSubmit}>
                    <input type="hidden" name="remember" value="true" />
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <label htmlFor="email-address" className="sr-only">
                                Email address
                            </label>
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-slate-300 placeholder-slate-500 text-slate-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                placeholder="Email address"
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="sr-only">
                                Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-slate-300 placeholder-slate-500 text-slate-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                placeholder="Password"
                            />
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                            {loading ? 'Signing in...' : 'Sign in'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
