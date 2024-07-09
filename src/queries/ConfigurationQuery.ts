import { gql } from '@apollo/client/core';

const query = gql`
query Configuration {
  configuration {
    ...ConfigData
    __typename
  }
}

fragment ConfigData on ConfigResult {
  general {
    ...ConfigGeneralData
    __typename
  }
  interface {
    ...ConfigInterfaceData
    __typename
  }
  dlna {
    ...ConfigDLNAData
    __typename
  }
  scraping {
    ...ConfigScrapingData
    __typename
  }
  defaults {
    ...ConfigDefaultSettingsData
    __typename
  }
  ui
  plugins
  __typename
}

fragment ConfigGeneralData on ConfigGeneralResult {
  stashes {
    path
    excludeVideo
    excludeImage
    __typename
  }
  databasePath
  backupDirectoryPath
  generatedPath
  metadataPath
  scrapersPath
  pluginsPath
  cachePath
  blobsPath
  blobsStorage
  ffmpegPath
  ffprobePath
  calculateMD5
  videoFileNamingAlgorithm
  parallelTasks
  previewAudio
  previewSegments
  previewSegmentDuration
  previewExcludeStart
  previewExcludeEnd
  previewPreset
  transcodeHardwareAcceleration
  maxTranscodeSize
  maxStreamingTranscodeSize
  writeImageThumbnails
  createImageClipsFromVideos
  apiKey
  username
  password
  maxSessionAge
  logFile
  logOut
  logLevel
  logAccess
  createGalleriesFromFolders
  galleryCoverRegex
  videoExtensions
  imageExtensions
  galleryExtensions
  excludes
  imageExcludes
  customPerformerImageLocation
  stashBoxes {
    name
    endpoint
    api_key
    __typename
  }
  pythonPath
  transcodeInputArgs
  transcodeOutputArgs
  liveTranscodeInputArgs
  liveTranscodeOutputArgs
  drawFunscriptHeatmapRange
  scraperPackageSources {
    name
    url
    local_path
    __typename
  }
  pluginPackageSources {
    name
    url
    local_path
    __typename
  }
  __typename
}

fragment ConfigInterfaceData on ConfigInterfaceResult {
  menuItems
  soundOnPreview
  wallShowTitle
  wallPlayback
  showScrubber
  maximumLoopDuration
  noBrowser
  notificationsEnabled
  autostartVideo
  autostartVideoOnPlaySelected
  continuePlaylistDefault
  showStudioAsText
  css
  cssEnabled
  javascript
  javascriptEnabled
  customLocales
  customLocalesEnabled
  language
  imageLightbox {
    slideshowDelay
    displayMode
    scaleUp
    resetZoomOnNav
    scrollMode
    scrollAttemptsBeforeChange
    __typename
  }
  disableDropdownCreate {
    performer
    tag
    studio
    movie
    __typename
  }
  handyKey
  funscriptOffset
  useStashHostedFunscript
  __typename
}

fragment ConfigDLNAData on ConfigDLNAResult {
  serverName
  enabled
  port
  whitelistedIPs
  interfaces
  videoSortOrder
  __typename
}

fragment ConfigScrapingData on ConfigScrapingResult {
  scraperUserAgent
  scraperCertCheck
  scraperCDPPath
  excludeTagPatterns
  __typename
}

fragment ConfigDefaultSettingsData on ConfigDefaultSettingsResult {
  scan {
    scanGenerateCovers
    scanGeneratePreviews
    scanGenerateImagePreviews
    scanGenerateSprites
    scanGeneratePhashes
    scanGenerateThumbnails
    scanGenerateClipPreviews
    __typename
  }
  identify {
    sources {
      source {
        ...ScraperSourceData
        __typename
      }
      options {
        ...IdentifyMetadataOptionsData
        __typename
      }
      __typename
    }
    options {
      ...IdentifyMetadataOptionsData
      __typename
    }
    __typename
  }
  autoTag {
    performers
    studios
    tags
    __typename
  }
  generate {
    covers
    sprites
    previews
    imagePreviews
    previewOptions {
      previewSegments
      previewSegmentDuration
      previewExcludeStart
      previewExcludeEnd
      previewPreset
      __typename
    }
    markers
    markerImagePreviews
    markerScreenshots
    transcodes
    phashes
    interactiveHeatmapsSpeeds
    clipPreviews
    imageThumbnails
    __typename
  }
  deleteFile
  deleteGenerated
  __typename
}

fragment ScraperSourceData on ScraperSource {
  stash_box_index
  stash_box_endpoint
  scraper_id
  __typename
}

fragment IdentifyMetadataOptionsData on IdentifyMetadataOptions {
  fieldOptions {
    ...IdentifyFieldOptionsData
    __typename
  }
  setCoverImage
  setOrganized
  includeMalePerformers
  skipMultipleMatches
  skipMultipleMatchTag
  skipSingleNamePerformers
  skipSingleNamePerformerTag
  __typename
}

fragment IdentifyFieldOptionsData on IdentifyFieldOptions {
  field
  strategy
  createMissing
  __typename
}
`

export { query }