import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import FileModel from '@/models/File'
import UserModel from '@/models/User'

export async function GET(request: NextRequest) {
  try {
    console.log('Analytics API called');
    
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      console.log('No auth header');
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)
    if (!decoded) {
      console.log('Invalid token');
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 })
    }

    console.log('Connecting to database...');
    await dbConnect()
    console.log('Database connected');

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '7d' // 7d, 30d, 90d, 1y

    // Calculate date range
    const now = new Date()
    let startDate: Date
    switch (period) {
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        break
      default: // 7d
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    }

    // Basic statistics
    console.log('Fetching basic statistics...');
    const totalFiles = await FileModel.countDocuments()
    console.log('Total files:', totalFiles);
    
    const totalSizeResult = await FileModel.aggregate([
      { $group: { _id: null, totalSize: { $sum: '$size' } } }
    ])
    const totalSize = totalSizeResult[0]?.totalSize || 0
    console.log('Total size:', totalSize);

    const recentFiles = await FileModel.countDocuments({
      createdAt: { $gte: startDate }
    })
    console.log('Recent files:', recentFiles);

    // Category distribution
    const categoryStats = await FileModel.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          size: { $sum: '$size' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ])

    // Popular tags
    const tagStats = await FileModel.aggregate([
      { $unwind: '$tags' },
      {
        $group: {
          _id: '$tags',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      { $limit: 20 }
    ])

    // File type distribution
    const typeStats = await FileModel.aggregate([
      {
        $addFields: {
          fileType: {
            $cond: [
              { $regexMatch: { input: '$mimeType', regex: /^image\// } },
              'Images',
              {
                $cond: [
                  { $regexMatch: { input: '$mimeType', regex: /^video\// } },
                  'Videos',
                  {
                    $cond: [
                      { $regexMatch: { input: '$mimeType', regex: /^application\/pdf/ } },
                      'PDFs',
                      'Others'
                    ]
                  }
                ]
              }
            ]
          }
        }
      },
      {
        $group: {
          _id: '$fileType',
          count: { $sum: 1 },
          size: { $sum: '$size' }
        }
      }
    ])

    // User activity (simplified for now)
    const userStats = decoded.role === 'admin' ? await FileModel.aggregate([
      {
        $match: { createdAt: { $gte: startDate } }
      },
      {
        $group: {
          _id: '$uploadedBy',
          count: { $sum: 1 },
          size: { $sum: '$size' }
        }
      },
      {
        $sort: { count: -1 }
      },
      { $limit: 10 }
    ]) : []

    const analytics = {
      overview: {
        totalFiles,
        totalSize,
        recentFiles,
        period
      },
      dailyStats: [], // Simplified for now
      categoryStats,
      tagStats,
      userStats,
      typeStats
    }

    return NextResponse.json(analytics)
  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
