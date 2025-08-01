import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";

export default function DebugPix() {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);
  const { user, token, setAuth } = useAuthStore();

  const runTests = async () => {
    setIsLoading(true);
    const results: any = {};

    try {
      // Test 1: Check current user state
      results.currentUser = user;
      results.currentUserPix = user?.pix || 'AUSENTE';
      results.hasToken = !!token;

      // Test 2: Fetch fresh user data
      if (token) {
        const response = await fetch('/api/auth/user', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const freshUserData = await response.json();
          results.freshUserData = freshUserData;
          results.freshUserPix = freshUserData.pix || 'AUSENTE';
          
          // Test 3: Update Zustand state with fresh data
          setAuth(freshUserData, token);
          results.updatedState = true;
        } else {
          results.freshUserError = await response.text();
        }
      }

      // Test 4: Check localStorage
      const storedAuth = localStorage.getItem('auth-storage');
      if (storedAuth) {
        const parsed = JSON.parse(storedAuth);
        results.localStorageUser = parsed.state?.user;
        results.localStoragePix = parsed.state?.user?.pix || 'AUSENTE';
      }

    } catch (error: any) {
      results.error = error.message;
    }

    setDebugInfo(results);
    setIsLoading(false);
  };

  const clearLocalStorage = () => {
    localStorage.removeItem('auth-storage');
    window.location.reload();
  };

  const forceLogin = async () => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@alugae.mobi',
          password: '123456'
        })
      });

      if (response.ok) {
        const { user: freshUser, token: freshToken } = await response.json();
        setAuth(freshUser, freshToken);
        await runTests();
      }
    } catch (error) {
      console.error('Force login failed:', error);
    }
  };

  useEffect(() => {
    runTests();
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Debug PIX Field Issue</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-4">
            <Button onClick={runTests} disabled={isLoading}>
              {isLoading ? 'Running Tests...' : 'Run Tests'}
            </Button>
            <Button onClick={forceLogin} variant="outline">
              Force Login
            </Button>
            <Button onClick={clearLocalStorage} variant="destructive">
              Clear Cache & Reload
            </Button>
          </div>

          <div className="bg-gray-100 p-4 rounded-lg">
            <h3 className="font-bold mb-2">Current User State:</h3>
            <p>Name: {user?.name || 'Not logged in'}</p>
            <p>PIX: {user?.pix || 'AUSENTE'}</p>
            <p>Has Token: {token ? 'Yes' : 'No'}</p>
          </div>

          {Object.keys(debugInfo).length > 0 && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-bold mb-2">Debug Results:</h3>
              <pre className="text-sm overflow-auto">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}