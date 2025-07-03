import React, { useState } from 'react';
import { Channel, Category } from '../types';
import { ChevronLeft, ChevronRight, Search, Grid, List } from 'lucide-react';

interface LiveTVProps {
  onChannelSelect: (channel: Channel) => void;
}

const LiveTV: React.FC<LiveTVProps> = ({ onChannelSelect }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Mock data for categories and channels
  const categories: Category[] = [
    {
      id: 'all',
      name: 'All Channels',
      channels: []
    },
    {
      id: 'General',
      name: 'General',
      channels: []
    },
    {
      id: 'Sports',
      name: 'Sports',
      channels: []
    },
    {
      id: 'News',
      name: 'News',
      channels: []
    },
    {
      id: 'Business',
      name: 'Business',
      channels: []
    },
    {
      id: 'Morocco',
      name: 'Morocco',
      channels: []
    },
    {
      id: 'arabic',
      name: 'arabic',
      channels: []
    },
    {
      id: 'Religious',
      name: 'Religious',
      channels: []
    }
  ];

  const channels: Channel[] = [
    {
      "id": "3",
      "name": "2M Monde +1 (1080p)",
      "logo": "https://i.imgur.com/MvpntzA.png",
      "streamUrl": "https://d2qh3gh0k5vp3v.cloudfront.net/v1/master/3722c60a815c199d9c0ef36c5b73da68a62b09d1/cc-n6pess5lwbghr/2M_ES.m3u8",
      "category": "General"
    },
    {
      "id": "4",
      "name": "ABN Africa (480p)",
      "logo": "https://i.imgur.com/SLrX8Ef.png",
      "streamUrl": "https://mediaserver.abnvideos.com/streams/abnafrica.m3u8",
      "category": "Religious"
    },
    {
      "id": "5",
      "name": "Abu Dhabi Sports 1 (1080p)",
      "logo": "https://i.imgur.com/6BVWk8z.png",
      "streamUrl": "https://vo-live-media.cdb.cdn.orange.com/Content/Channel/AbuDhabiSportsChannel1/HLS/index.m3u8",
      "category": "Sports"
    },
    {
      "id": "6",
      "name": "Aflam (1080p)",
      "logo": "https://i.imgur.com/cTLj7Yt.png",
      "streamUrl": "https://shls-live-enc.edgenextcdn.net/out/v1/0044dd4b001a466c941ad77b04a574a2/index.m3u8",
      "category": "Movies"
    },
    {
      "id": "7",
      "name": "Aflam TV",
      "logo": "https://i.imgur.com/XqQxO9J.png",
      "streamUrl": "https://fl1002.bozztv.com/ga-aflamtv7/index.m3u8",
      "category": "Movies"
    },
    {
      "id": "8",
      "name": "Africa 24 (1080p)",
      "logo": "https://i.imgur.com/YWIJdai.png",
      "streamUrl": "https://africa24.vedge.infomaniak.com/livecast/ik:africa24/manifest.m3u8",
      "category": "News"
    },
    {
      "id": "9",
      "name": "Africa 24 Sport (1080p)",
      "logo": "https://i.imgur.com/YWIJdai.png",
      "streamUrl": "https://africa24.vedge.infomaniak.com/livecast/ik:africa24sport/manifest.m3u8",
      "category": "Sports"
    },
    {
      "id": "10",
      "name": "Africanews",
      "logo": "https://i.imgur.com/5UxU4zc.png",
      "streamUrl": "https://rakuten-africanews-1-pt.samsung.wurl.tv/manifest/playlist.m3u8",
      "category": "News"
    },
    {
      "id": "11",
      "name": "Africanews French (720p)",
      "logo": "https://i.imgur.com/5UxU4zc.png",
      "streamUrl": "https://2767164d5ee04887b96812a9eea74d32.mediatailor.eu-west-1.amazonaws.com/v1/manifest/0547f18649bd788bec7b67b746e47670f558b6b2/production-LiveChannel-6573/44d3df93-4a3e-43e0-990f-a5d196bbe3aa/5.m3u8",
      "category": "News"
    },
    {
      "id": "12",
      "name": "Afroturk TV (1080p)",
      "logo": "https://i.imgur.com/fWlLvRA.png",
      "streamUrl": "https://edge.socialsmart.tv/naturaltv/bant1/playlist.m3u8",
      "category": "General"
    },
    {
      "id": "13",
      "name": "Al Aoula Inter (480p)",
      "logo": "https://i.imgur.com/nq53d2N.png",
      "streamUrl": "https://cdn.live.easybroadcast.io/ts_corp/73_aloula_w1dqfwm/playlist_dvr.m3u8",
      "category": "General"
    },
    {
      "id": "14",
      "name": "Al Aoula Laâyoune (480p)",
      "logo": "https://www.snrt.ma/sites/default/files/2023-04/laayoune.png",
      "streamUrl": "https://cdn.live.easybroadcast.io/abr_corp/73_laayoune_pgagr52/corp/73_laayoune_pgagr52_480p/chunks_dvr.m3u8",
      "category": "General"
    },
    {
      "id": "15",
      "name": "Al Arabiya (1080p)",
      "logo": "https://i.imgur.com/NXFkYFj.png",
      "streamUrl": "https://live.alarabiya.net/alarabiapublish/alarabiya.smil/playlist.m3u8",
      "category": "News"
    },
    {
      "id": "16",
      "name": "Al Arabiya Al Hadath (1080p) [Not 24/7]",
      "logo": "https://i.imgur.com/De4SEWE.png",
      "streamUrl": "https://av.alarabiya.net/alarabiapublish/alhadath.smil/playlist.m3u8",
      "category": "News"
    },
    {
      "id": "17",
      "name": "Al Arabiya Business (1080p)",
      "logo": "https://i.imgur.com/eEV4r6J.jpg",
      "streamUrl": "https://live.alarabiya.net/alarabiapublish/aswaaq.smil/playlist.m3u8",
      "category": "Business"
    },
    {
      "id": "18",
      "name": "Al Arabiya Programs (1080p)",
      "logo": "https://i.imgur.com/Hoc3cfO.png",
      "streamUrl": "https://d1j4r34gq3qw9y.cloudfront.net/out/v1/96804f3a14864641a21c25e8ca9afb74/index.m3u8",
      "category": "Undefined"
    },
    {
      "id": "19",
      "name": "Al Araby TV 2 (1080p)",
      "logo": "https://i.imgur.com/Gp5mNea.png",
      "streamUrl": "https://alarabyta.cdn.octivid.com/alaraby2n/smil:alaraby2n.stream.smil/chunklist.m3u8",
      "category": "News"
    },
    {
      "id": "20",
      "name": "Al Araby TV (1080p)",
      "logo": "https://i.imgur.com/YMqWEe4.png",
      "streamUrl": "https://alarabyta.cdn.octivid.com/alaraby/smil:alaraby.stream.smil/chunklist.m3u8",
      "category": "News"
    },
    {
      "id": "21",
      "name": "Al Hayat TV (720p)",
      "logo": "https://i.imgur.com/M8ZuzeB.png",
      "streamUrl": "https://cdn3.wowza.com/5/OE5HREpIcEkySlNT/alhayat-live/ngrp:livestream_all/playlist.m3u8",
      "category": "Religious"
    },
    {
      "id": "22",
      "name": "Al Jazeera (1080p)",
      "logo": "https://i.imgur.com/7bRVpnu.png",
      "streamUrl": "https://live-hls-apps-aja-fa.getaj.net/AJA/index.m3u8",
      "category": "News"
    },
    {
      "id": "23",
      "name": "Al Jazeera Documentary (1080p) [Geo-blocked]",
      "logo": "https://i.imgur.com/5dNJlLo.png",
      "streamUrl": "https://live-hls-apps-ajd-fa.getaj.net/AJD/index.m3u8",
      "category": "News"
    },
    {
      "id": "24",
      "name": "Al Jazeera Mubasher 24 (1080p)",
      "logo": "https://yt3.googleusercontent.com/h0_bBdVgCAXIPJFnQ4hZtE87cDY_qO7rkDAue8qXdmOFxZ5NaO3AFD1uCUcst-EsBcGJ8zl8EQ=s160-c-k-c0x00ffffff-no-rj",
      "streamUrl": "https://live-hls-apps-ajm24-fa.getaj.net/AJM24/index.m3u8",
      "category": "News"
    },
    {
      "id": "25",
      "name": "Al Jazeera Mubasher (1080p)",
      "logo": "https://yt3.googleusercontent.com/h0_bBdVgCAXIPJFnQ4hZtE87cDY_qO7rkDAue8qXdmOFxZ5NaO3AFD1uCUcst-EsBcGJ8zl8EQ=s160-c-k-c0x00ffffff-no-rj",
      "streamUrl": "https://live-hls-apps-ajm-fa.getaj.net/AJM/index.m3u8",
      "category": "News"
    },
    {
      "id": "26",
      "name": "Al Jazeera Mubasher Broadcast 2 (1080p)",
      "logo": "https://yt3.googleusercontent.com/h0_bBdVgCAXIPJFnQ4hZtE87cDY_qO7rkDAue8qXdmOFxZ5NaO3AFD1uCUcst-EsBcGJ8zl8EQ=s160-c-k-c0x00ffffff-no-rj",
      "streamUrl": "https://live-hls-apps-ajm2-fa.getaj.net/AJM2/index.m3u8",
      "category": "News"
    },
    {
      "id": "27",
      "name": "Al Maghribia (480p)",
      "logo": "https://i.imgur.com/7GaahYh.png",
      "streamUrl": "https://cdn.live.easybroadcast.io/abr_corp/73_almaghribia_83tz85q/corp/73_almaghribia_83tz85q_480p/chunks_dvr.m3u8",
      "category": "General"
    },
    {
      "id": "28",
      "name": "Al Qamar TV (1080p)",
      "logo": "https://i.imgur.com/zkBT0C8.png",
      "streamUrl": "https://streamer3.premio.link/alqamar/playlist.m3u8",
      "category": "Undefined"
    },
    {
      "id": "29",
      "name": "Amani TV (1080p) [Not 24/7]",
      "logo": "https://i.imgur.com/0cY4K7G.png",
      "streamUrl": "https://goccn.cloud/hls/amanitv/index.m3u8",
      "category": "Culture"
    },
    {
      "id": "30",
      "name": "Angel TV Africa (720p)",
      "logo": "https://i.imgur.com/qKLEGU7.png",
      "streamUrl": "https://cdn3.wowza.com/5/TDJ0aWNkNXFxWWta/angeltvcloud/ngrp:angelafrica_all/playlist.m3u8",
      "category": "Religious"
    },
    {
      "id": "31",
      "name": "Angel TV Arabia (720p)",
      "logo": "https://i.imgur.com/qKLEGU7.png",
      "streamUrl": "https://cdn3.wowza.com/5/TDJ0aWNkNXFxWWta/angeltvcloud/ngrp:angelarabia_all/playlist.m3u8",
      "category": "Religious"
    },
    {
      "id": "32",
      "name": "Arryadia (480p)",
      "logo": "https://i.imgur.com/XjzK3gZ.png",
      "streamUrl": "https://cdn.live.easybroadcast.io/abr_corp/73_arryadia_k2tgcj0/corp/73_arryadia_k2tgcj0_480p/chunks_dvr.m3u8",
      "category": "Sports"
    },
    {
      "id": "33",
      "name": "Asharq Discovery (1080p) [Geo-blocked]",
      "logo": "https://i.imgur.com/Czxi7yk.png",
      "streamUrl": "https://svs.itworkscdn.net/asharqdiscoverylive/asharqd.smil/playlist_dvr.m3u8",
      "category": "Documentary"
    },
    {
      "id": "34",
      "name": "Asharq Documentary (1080p)",
      "logo": "https://yt3.googleusercontent.com/AFUZ79or1rvrFKbfaMDdoJ1n_814lANCdUOdH0mdGRmcYfIfDH4cfTWwyUkHwie2I2xJPlaTJg=s512-c-k-c0x00ffffff-no-rj",
      "streamUrl": "https://svs.itworkscdn.net/asharqdocumentarylive/asharqdocumentary.smil/playlist_dvr.m3u8",
      "category": "Documentary"
    },
    {
      "id": "35",
      "name": "Assadissa (480p)",
      "logo": "https://i.imgur.com/un6qTGO.png",
      "streamUrl": "https://cdn.live.easybroadcast.io/abr_corp/73_assadissa_7b7u5n1/corp/73_assadissa_7b7u5n1_480p/chunks_dvr.m3u8",
      "category": "Religious"
    },
    {
      "id": "36",
      "name": "Athaqafia (480p)",
      "logo": "https://i.imgur.com/mrwFI2L.png",
      "streamUrl": "https://cdn.live.easybroadcast.io/ts_corp/73_arrabia_hthcj4p/playlist_dvr.m3u8",
      "category": "Culture"
    },
    {
      "id": "37",
      "name": "Bab Al Hara (1080p)",
      "logo": "https://i.imgur.com/QtlnZbq.png",
      "streamUrl": "https://shls-live-enc.edgenextcdn.net/out/v1/948c54279b594944adde578c95f1d7d1/index.m3u8",
      "category": "Series"
    },
    {
      "id": "38",
      "name": "BBC Arabic (720p)",
      "logo": "https://i.imgur.com/ScyTG6P.png",
      "streamUrl": "https://vs-cmaf-pushb-ww-live.akamaized.net/x=4/i=urn:bbc:pips:service:bbc_arabic_tv/pc_hd_abr_v2.mpd",
      "category": "News"
    },
    {
      "id": "39",
      "name": "BBC News (720p)",
      "logo": "https://i.imgur.com/vSz2WEp.png",
      "streamUrl": "https://vs-cmaf-push-ww-live.akamaized.net/x=4/i=urn:bbc:pips:service:bbc_news_channel_hd/iptv_hd_abr_v1.mpd",
      "category": "News"
    },
    {
      "id": "40",
      "name": "Bloomberg TV EMEA Live Event (720p)",
      "logo": "https://i.imgur.com/OuogLHx.png",
      "streamUrl": "https://bloomberg.com/media-manifest/streams/eu-event.m3u8",
      "category": "Business"
    },
    {
      "id": "41",
      "name": "Canal 2 International",
      "logo": "https://i.imgur.com/BzA2z7m.png",
      "streamUrl": "http://69.64.57.208/canal2international/playlist.m3u8",
      "category": "General"
    },
    {
      "id": "42",
      "name": "CGTN Arabic (1080p) [Not 24/7]",
      "logo": "https://i.imgur.com/AkFFrS7.png",
      "streamUrl": "https://arabic-livews.cgtn.com/hls/LSveq57bErWLinBnxosqjisZ220802LSTefTAS9zc9mpU08y3np9TH220802cd/playlist.m3u8",
      "category": "News"
    },
    {
      "id": "43",
      "name": "Chada TV (720p)",
      "logo": "https://i.imgur.com/inJyJBN.png",
      "streamUrl": "https://chadatv.vedge.infomaniak.com/livecast/chadatv/playlist.m3u8",
      "category": "General"
    },
    {
      "id": "44",
      "name": "CNA (Chaîne Nord Africaine) (360p) [Not 24/7]",
      "logo": "https://i.imgur.com/Ki3ySUE.png",
      "streamUrl": "https://live.creacast.com/cna/smil:cna.smil/playlist.m3u8",
      "category": "Religious"
    },
    {
      "id": "45",
      "name": "CNBC Africa (480p)",
      "logo": "https://i.imgur.com/BnNYzWI.png",
      "streamUrl": "https://5be2f59e715dd.streamlock.net/CNBC/smil:CNBCSandton.smil/playlist.m3u8",
      "category": "Business"
    },
    {
      "id": "46",
      "name": "CNBC Arabiya (1080p)",
      "logo": "https://i.imgur.com/opBXx1K.png",
      "streamUrl": "https://cnbc-live.akamaized.net/cnbc/master.m3u8",
      "category": "Business"
    },
    {
      "id": "47",
      "name": "CuriosityStream (720p)",
      "logo": "https://i.imgur.com/KUb4vEz.png",
      "streamUrl": "https://fl3.moveonjoy.com/Curiosity_Stream/index.m3u8",
      "category": "Education"
    },
    {
      "id": "48",
      "name": "Dubai One (1080p)",
      "logo": "https://i.imgur.com/Dj16oKL.png",
      "streamUrl": "https://dminnvllta.cdn.mgmlcdn.com/dubaione/smil:dubaione.stream.smil/chunklist.m3u8",
      "category": "General"
    },
    {
      "id": "49",
      "name": "DW Arabic (1080p)",
      "logo": "https://i.imgur.com/8MRNFb9.png",
      "streamUrl": "https://dwamdstream103.akamaized.net/hls/live/2015526/dwstream103/index.m3u8",
      "category": "News"
    },
    {
      "id": "50",
      "name": "EWTN Africa Asia (720p)",
      "logo": "https://i.imgur.com/sua70RO.png",
      "streamUrl": "https://cdn3.wowza.com/1/ZVBYYXFLLzE0c3NC/Qk1FMURC/hls/live/playlist.m3u8",
      "category": "Religious"
    },
    {
      "id": "51",
      "name": "For You TV (480p)",
      "logo": "https://i.imgur.com/1oMboXL.png",
      "streamUrl": "https://stream.az-multimedia.com:3793/live/foryoutvlive.m3u8",
      "category": "News"
    },
    {
      "id": "52",
      "name": "France 24 Arabic (1080p)",
      "logo": "https://i.imgur.com/u8N6uoj.png",
      "streamUrl": "https://live.france24.com/hls/live/2037222-b/F24_AR_HI_HLS/master_5000.m3u8",
      "category": "News"
    },
    {
      "id": "53",
      "name": "GOD TV Africa (576p)",
      "logo": "https://i.imgur.com/hW4g2oe.png",
      "streamUrl": "https://webstreaming.viewmedia.tv/web_006/Stream/playlist.m3u8",
      "category": "Religious"
    },
    {
      "id": "54",
      "name": "IBN TV Africa (720p)",
      "logo": "https://i.imgur.com/eKy2ocd.png",
      "streamUrl": "http://68.183.41.209:8080/live/5d9a537c64b9c/index.m3u8",
      "category": "Religious"
    },
    {
      "id": "55",
      "name": "Majid TV (1080p)",
      "logo": "https://i.imgur.com/TzOKMMy.png",
      "streamUrl": "https://vo-live.cdb.cdn.orange.com/Content/Channel/MajidChildrenChannel/HLS/index.m3u8",
      "category": "Kids"
    },
    {
      "id": "56",
      "name": "MBC 1 (1080p)",
      "logo": "https://i.imgur.com/CiA3plN.png",
      "streamUrl": "https://d3o3cim6uzorb4.cloudfront.net/out/v1/0965e4d7deae49179172426cbfb3bc5e/index.m3u8",
      "category": "General"
    },
    {
      "id": "57",
      "name": "MBC 2 (480p)",
      "logo": "https://i.imgur.com/n9mSHuP.png",
      "streamUrl": "https://edge66.magictvbox.com/liveApple/MBC_2/index.m3u8",
      "category": "Movies"
    },
    {
      "id": "58",
      "name": "MBC 3 KSA (1080p)",
      "logo": "https://i.imgur.com/PVt8OPN.png",
      "streamUrl": "https://shls-mbc3-prod-dub.shahid.net/out/v1/d5bbe570e1514d3d9a142657d33d85e6/index.m3u8",
      "category": "Kids"
    },
    {
      "id": "59",
      "name": "MBC 4 (1080p)",
      "logo": "https://i.imgur.com/BcXASJp.png",
      "streamUrl": "https://shls-masr-prod-dub.shahid.net/out/v1/c08681f81775496ab4afa2bac7ae7638/index.m3u8",
      "category": "Entertainment"
    },
    {
      "id": "60",
      "name": "MBC 5 (1080p)",
      "logo": "https://i.imgur.com/fRWaDyF.png",
      "streamUrl": "https://shls-mbc5-prod-dub.shahid.net/out/v1/2720564b6a4641658fdfb6884b160da2/index.m3u8",
      "category": "Family"
    },
    {
      "id": "61",
      "name": "MBC Bollywood (1080p) [Geo-blocked]",
      "logo": "https://i.imgur.com/TTAGFHG.png",
      "streamUrl": "https://shd-gcp-live.edgenextcdn.net/live/bitmovin-mbc-bollywood/546eb40d7dcf9a209255dd2496903764/index.m3u8",
      "category": "Movies"
    },
    {
      "id": "62",
      "name": "MBC Drama KSA (1080p)",
      "logo": "https://i.imgur.com/g5PWnqp.png",
      "streamUrl": "https://mbc1-enc.edgenextcdn.net/out/v1/b0b3a0e6750d4408bb86d703d5feffd1/index.m3u8",
      "category": "Entertainment"
    },
    {
      "id": "63",
      "name": "MBC FM (1080p)",
      "logo": "https://i.imgur.com/lF8UxvR.png",
      "streamUrl": "https://dbbv9umqcd7cs.cloudfront.net/out/v1/db15b75c3cc0400c91961468d6a232ac/index.m3u8",
      "category": "Music"
    },
    {
      "id": "64",
      "name": "MBC+ Drama (1080p)",
      "logo": "https://i.imgur.com/lxWdjXG.png",
      "streamUrl": "https://mbcplusdrama-prod-dub-enc.edgenextcdn.net/out/v1/97ca0ce6fc6142f4b14c0a694af59eab/index.m3u8",
      "category": "Movies"
    },
    {
      "id": "65",
      "name": "Medi 1 TV Afrique (1080p) [Not 24/7]",
      "logo": "https://i.imgur.com/OioFepy.jpeg",
      "streamUrl": "https://streaming1.medi1tv.com/live/smil:medi1fr.smil/playlist.m3u8",
      "category": "News"
    },
    {
      "id": "66",
      "name": "Medi 1 TV Arabic (1080p) [Not 24/7]",
      "logo": "https://i.imgur.com/jWKH922.jpeg",
      "streamUrl": "https://streaming1.medi1tv.com/live/smil:medi1ar.smil/playlist.m3u8",
      "category": "News"
    },
    {
      "id": "67",
      "name": "Medi 1 TV Maghreb (1080p) [Not 24/7]",
      "logo": "https://i.imgur.com/LbeChWy.jpeg",
      "streamUrl": "https://streaming1.medi1tv.com/live/smil:medi1tv.smil/playlist.m3u8",
      "category": "News"
    },
    {
      "id": "68",
      "name": "Movies Action (1080p)",
      "logo": "https://i.imgur.com/NIVhISa.png",
      "streamUrl": "https://shls-live-enc.edgenextcdn.net/out/v1/46079e838e65490c8299f902a7731168/index.m3u8",
      "category": "Movies"
    },
    {
      "id": "69",
      "name": "Movies Thriller (1080p)",
      "logo": "https://i.imgur.com/JWihdcl.png",
      "streamUrl": "https://shls-live-enc.edgenextcdn.net/out/v1/f6d718e841f8442f8374de47f18c93a7/index.m3u8",
      "category": "Movies"
    },
    {
      "id": "70",
      "name": "MTV Hits Europe",
      "logo": "https://i.imgur.com/zNscEST.png",
      "streamUrl": "http://45.88.92.3/tr3_MTVHits_SD/index.m3u8?token=test",
      "category": "Music"
    },
    {
      "id": "71",
      "name": "National Geographic Abu Dhabi (1080p) [Geo-blocked]",
      "logo": "https://i.imgur.com/fNA00VF.png",
      "streamUrl": "https://vo-live.cdb.cdn.orange.com/Content/Channel/NationalGeographicHDChannel/HLS/index.m3u8",
      "category": "Documentary"
    },
    {
      "id": "72",
      "name": "PMC (1080p)",
      "logo": "https://i.imgur.com/AbrHI7K.png",
      "streamUrl": "https://hls.pmc.live/hls/stream.m3u8",
      "category": "Music"
    },
    {
      "id": "73",
      "name": "PMC Royale (720p)",
      "logo": "https://www.lyngsat.com/logo/tv/pp/pmc-royale-ch.png",
      "streamUrl": "https://rohls.pmc.live/hls/stream.m3u8",
      "category": "Music"
    },
    {
      "id": "74",
      "name": "Qwest TV (1080p)",
      "logo": "https://i.imgur.com/DjgNNHK.png",
      "streamUrl": "https://qwestjazz-rakuten.amagi.tv/hls/amagi_hls_data_rakutenAA-qwestjazz-rakuten/CDN/master.m3u8",
      "category": "Music"
    },
    {
      "id": "75",
      "name": "Rai Italia",
      "logo": "https://i.imgur.com/1nN4rEP.png",
      "streamUrl": "https://ilglobotv-live.akamaized.net/channels/RAIItaliaSudAfrica/Live.m3u8",
      "category": "Undefined"
    },
    {
      "id": "76",
      "name": "Ramez (1080p)",
      "logo": "https://i.imgur.com/aCJeVSr.png",
      "streamUrl": "https://shls-live-enc.edgenextcdn.net/out/v1/0ef83323c0374a1187c182645db2a45f/index.m3u8",
      "category": "Comedy"
    },
    {
      "id": "77",
      "name": "REFLET TV (1080p)",
      "logo": "https://i.imgur.com/EauXR22.png",
      "streamUrl": "https://edge-a3.evrideo.tv/8f37c9f0-fe22-44f4-b64a-76ad11730daf_1000026630_HLS/manifest.m3u8",
      "category": "General"
    },
    {
      "id": "78",
      "name": "Romanza+ Africa (720p)",
      "logo": "https://i.imgur.com/HYg75w2.png",
      "streamUrl": "https://origin3.afxp.telemedia.co.za/PremiumFree/romanza/playlist.m3u8",
      "category": "Undefined"
    },
    {
      "id": "79",
      "name": "RT Arabic (1080p) [Geo-blocked]",
      "logo": "https://i.imgur.com/G8vGrn1.png",
      "streamUrl": "https://rt-arb.rttv.com/dvr/rtarab/playlist.m3u8",
      "category": "News"
    },
    {
      "id": "80",
      "name": "RTP África (504p) [Not 24/7]",
      "logo": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/RTP_%C3%81frica_2016_%28Reduced_Version%29.svg/512px-RTP_%C3%81frica_2016_%28Reduced_Version%29.svg.png",
      "streamUrl": "https://streaming-live.rtp.pt/liverepeater/smil:rtpafrica.smil/playlist.m3u8",
      "category": "General"
    },
    {
      "id": "81",
      "name": "Sky News Arabia (1080p) [Not 24/7]",
      "logo": "https://i.imgur.com/SvjU4h6.png",
      "streamUrl": "https://stream.skynewsarabia.com/ott/ott.m3u8",
      "category": "News"
    },
    {
      "id": "82",
      "name": "Sky News Arabia (Portrait) (1280p) [Not 24/7]",
      "logo": "https://i.imgur.com/FjtzQQs.png",
      "streamUrl": "https://stream.skynewsarabia.com/vertical/vertical.m3u8",
      "category": "News"
    },
    {
      "id": "83",
      "name": "Spacetoon Arabic (1080p)",
      "logo": "https://upload.wikimedia.org/wikipedia/en/2/2b/Spacetoon_logo.png",
      "streamUrl": "https://shd-gcp-live.edgenextcdn.net/live/bitmovin-spacetoon/d8382fb9ab4b2307058f12c7ea90db54/index.m3u8",
      "category": "Animation"
    },
    {
      "id": "84",
      "name": "StoryChannel TV (720p)",
      "logo": "https://i.imgur.com/ZBV6xph.png",
      "streamUrl": "https://136044159.r.cdnsun.net/storychannel.m3u8",
      "category": "Culture"
    },
    {
      "id": "85",
      "name": "Tamazight TV (480p)",
      "logo": "https://i.imgur.com/fm6S7we.png",
      "streamUrl": "https://cdn.live.easybroadcast.io/ts_corp/73_tamazight_tccybxt/playlist_dvr.m3u8",
      "category": "General"
    }
  ];

  const filteredChannels = channels.filter(channel => {
    const matchesCategory = selectedCategory === 'all' || channel.category === selectedCategory;
    const matchesSearch = channel.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-3xl font-bold text-white">Live TV</h2>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search channels..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-slate-800 text-white rounded-lg border border-slate-700 focus:border-blue-500 focus:outline-none w-64"
            />
          </div>
          <div className="flex bg-slate-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              selectedCategory === category.id
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>

      {/* Channels */}
      <div className={`${viewMode === 'grid' ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4' : 'space-y-2'}`}>
        {filteredChannels.map((channel) => (
          <div
            key={channel.id}
            onClick={() => onChannelSelect(channel)}
            className={`
              cursor-pointer transition-all duration-200 hover:scale-105 group
              ${viewMode === 'grid' 
                ? 'bg-slate-800 rounded-lg p-4 hover:bg-slate-700' 
                : 'bg-slate-800 rounded-lg p-3 hover:bg-slate-700 flex items-center gap-3'
              }
            `}
          >
            <div className={`${viewMode === 'grid' ? 'text-center' : 'flex items-center gap-3 w-full'}`}>
              <div className={`${viewMode === 'grid' ? 'mb-3' : 'flex-shrink-0'}`}>
                <div className={`${viewMode === 'grid' ? 'w-16 h-16' : 'w-12 h-12'} bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-lg mx-auto`}>
                  {channel.name.charAt(0)}
                </div>
              </div>
              <div className={`${viewMode === 'grid' ? 'text-center' : 'flex-1'}`}>
                <h3 className={`${viewMode === 'grid' ? 'text-sm' : 'text-base'} font-medium text-white group-hover:text-blue-400 transition-colors`}>
                  {channel.name}
                </h3>
                {viewMode === 'list' && (
                  <p className="text-xs text-slate-400 capitalize">{channel.category}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredChannels.length === 0 && (
        <div className="text-center py-20">
          <p className="text-slate-400 text-lg">No channels found</p>
        </div>
      )}
    </div>
  );
};

export default LiveTV;