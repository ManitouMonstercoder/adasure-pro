/**
 * AdaSure Pro - Cloudflare Worker API
 * Handles authentication, payments, and user management
 * Uses Cloudflare free tier: KV, D1, R2
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Enable CORS for all requests
    const corsHeaders = {
      'Access-Control-Allow-Origin': env.CORS_ORIGINS || 'https://adasure.github.io',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    };

    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      let response;

      // Route API requests
      if (path.startsWith('/auth/')) {
        response = await handleAuth(request, env, path);
      } else if (path.startsWith('/payments/')) {
        response = await handlePayments(request, env, path);
      } else if (path.startsWith('/users/')) {
        response = await handleUsers(request, env, path);
      } else if (path.startsWith('/api-keys/')) {
        response = await handleApiKeys(request, env, path);
      } else if (path === '/health') {
        response = new Response(JSON.stringify({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          version: '1.0.0'
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } else {
        response = new Response('Not Found', { status: 404 });
      }

      // Add CORS headers to all responses
      Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });

      return response;

    } catch (error) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({
        error: 'Internal Server Error',
        message: error.message
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
  },
};

// Authentication endpoints
async function handleAuth(request, env, path) {
  const method = request.method;

  if (path === '/auth/signup' && method === 'POST') {
    return handleSignup(request, env);
  } else if (path === '/auth/login' && method === 'POST') {
    return handleLogin(request, env);
  } else if (path === '/auth/logout' && method === 'POST') {
    return handleLogout(request, env);
  } else if (path === '/auth/me' && method === 'GET') {
    return handleGetCurrentUser(request, env);
  }

  return new Response('Not Found', { status: 404 });
}

// User signup
async function handleSignup(request, env) {
  try {
    const data = await request.json();
    const { email, password, firstName, lastName, companyName, planId } = data;

    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      return new Response(JSON.stringify({
        error: 'Missing required fields'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if user already exists (using KV store)
    const existingUser = await env.USERS_KV.get(`user:${email}`);
    if (existingUser) {
      return new Response(JSON.stringify({
        error: 'User already exists'
      }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Create user ID
    const userId = crypto.randomUUID();
    const createdAt = new Date().toISOString();

    // Hash password (simplified - use proper bcrypt in production)
    const hashedPassword = await hashPassword(password);

    // Store user data in KV
    const userData = {
      id: userId,
      email,
      firstName,
      lastName,
      companyName,
      planId,
      subscriptionStatus: 'trialing',
      createdAt,
      hashedPassword
    };

    await env.USERS_KV.put(`user:${email}`, JSON.stringify(userData));
    await env.USERS_KV.put(`userId:${userId}`, email);

    // Send welcome email (integrate with SendPulse)
    // await sendWelcomeEmail(email, userData, env);

    // Remove password from response
    const { hashedPassword: _, ...userResponse } = userData;

    return new Response(JSON.stringify({
      success: true,
      userId,
      user: userResponse
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Signup error:', error);
    return new Response(JSON.stringify({
      error: 'Signup failed'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// User login
async function handleLogin(request, env) {
  try {
    const { email, password } = await request.json();

    // Get user from KV store
    const userDataStr = await env.USERS_KV.get(`user:${email}`);
    if (!userDataStr) {
      return new Response(JSON.stringify({
        error: 'Invalid credentials'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const userData = JSON.parse(userDataStr);

    // Verify password
    const isValidPassword = await verifyPassword(password, userData.hashedPassword);
    if (!isValidPassword) {
      return new Response(JSON.stringify({
        error: 'Invalid credentials'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Generate JWT token
    const token = await generateJWT(userData.id, env.JWT_SECRET);

    // Update last login
    userData.lastLogin = new Date().toISOString();
    await env.USERS_KV.put(`user:${email}`, JSON.stringify(userData));

    // Remove password from response
    const { hashedPassword: _, ...userResponse } = userData;

    return new Response(JSON.stringify({
      success: true,
      token,
      user: userResponse
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Login error:', error);
    return new Response(JSON.stringify({
      error: 'Login failed'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Payment endpoints (Stripe integration)
async function handlePayments(request, env, path) {
  if (path === '/payments/create-checkout' && request.method === 'POST') {
    return handleCreateCheckout(request, env);
  } else if (path === '/payments/webhook' && request.method === 'POST') {
    return handleStripeWebhook(request, env);
  }

  return new Response('Not Found', { status: 404 });
}

// Create Stripe checkout session
async function handleCreateCheckout(request, env) {
  try {
    const { priceId, customerEmail } = await request.json();

    // Call Stripe API to create checkout session
    const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'payment_method_types[]': 'card',
        'line_items[0][price]': priceId,
        'line_items[0][quantity]': '1',
        'mode': 'subscription',
        'customer_email': customerEmail,
        'success_url': `${env.APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
        'cancel_url': `${env.APP_URL}/pricing`,
      }),
    });

    const session = await stripeResponse.json();

    return new Response(JSON.stringify({
      sessionId: session.id
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Checkout creation error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to create checkout session'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Utility functions
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

async function verifyPassword(password, hashedPassword) {
  const newHash = await hashPassword(password);
  return newHash === hashedPassword;
}

async function generateJWT(userId, secret) {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  const payload = {
    sub: userId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
  };

  const encodedHeader = btoa(JSON.stringify(header));
  const encodedPayload = btoa(JSON.stringify(payload));
  const signature = await sign(`${encodedHeader}.${encodedPayload}`, secret);

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

async function sign(data, secret) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

// Placeholder functions for other endpoints
async function handleLogout(request, env) {
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

async function handleGetCurrentUser(request, env) {
  // Implement JWT verification and user lookup
  return new Response(JSON.stringify({ error: 'Not implemented' }), {
    status: 501,
    headers: { 'Content-Type': 'application/json' }
  });
}

async function handleUsers(request, env, path) {
  return new Response(JSON.stringify({ error: 'Not implemented' }), {
    status: 501,
    headers: { 'Content-Type': 'application/json' }
  });
}

async function handleApiKeys(request, env, path) {
  return new Response(JSON.stringify({ error: 'Not implemented' }), {
    status: 501,
    headers: { 'Content-Type': 'application/json' }
  });
}

async function handleStripeWebhook(request, env) {
  return new Response(JSON.stringify({ error: 'Not implemented' }), {
    status: 501,
    headers: { 'Content-Type': 'application/json' }
  });
}