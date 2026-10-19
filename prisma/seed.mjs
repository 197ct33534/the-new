import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEMO_LEAGUE = "V.League 1 — mẫu";

const SAMPLE_ADMIN = {
  email: "admin@example.com",
  password: "admin123",
  name: "Admin mẫu",
};

const SAMPLE_READER = {
  email: "reader@example.com",
  password: "reader123",
  name: "Độc giả mẫu",
};

const ARTICLE_SLUGS = [
  "tong-hop-vong-5-v-league-mau",
  "chuyen-nhuong-cau-thu-tre-noi-bat",
  "cup-quoc-gia-lich-thi-dau-vong-16-doi",
  "nhan-dinh-tran-dieu-vi-mua-giai",
];

const IMG = {
  pitch: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200&q=80",
  crowd: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=1200&q=80",
  ball: "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=1200&q=80",
  stadium: "https://images.unsplash.com/photo-1459865268767-1d9b60340f55?w=1200&q=80",
};

function dayOffset(days, hourUtc = 12) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  d.setUTCHours(hourUtc, 0, 0, 0);
  return d;
}

async function upsertUser(data, password, role) {
  const passwordHash = await bcrypt.hash(password, 10);
  return prisma.user.upsert({
    where: { email: data.email },
    update: { passwordHash, name: data.name, role },
    create: { email: data.email, passwordHash, name: data.name, role },
  });
}

async function upsertCategory(slug, name, description, sortOrder) {
  return prisma.category.upsert({
    where: { slug },
    update: { name, description, sortOrder },
    create: { slug, name, description, sortOrder },
  });
}

async function upsertTag(slug, name) {
  return prisma.tag.upsert({
    where: { slug },
    update: { name },
    create: { slug, name },
  });
}

async function upsertTeam(row) {
  return prisma.team.upsert({
    where: { slug: row.slug },
    update: {
      name: row.name,
      shortName: row.shortName,
      country: row.country,
      logoUrl: row.logoUrl,
      stadium: row.stadium,
    },
    create: {
      slug: row.slug,
      name: row.name,
      shortName: row.shortName,
      country: row.country,
      logoUrl: row.logoUrl,
      stadium: row.stadium,
    },
  });
}

async function upsertMatch(row) {
  return prisma.match.upsert({
    where: { slug: row.slug },
    update: {
      league: row.league,
      round: row.round,
      matchday: row.matchday,
      venue: row.venue,
      kickoffAt: row.kickoffAt,
      status: row.status,
      homeScore: row.homeScore,
      awayScore: row.awayScore,
      homeTeamId: row.homeTeamId,
      awayTeamId: row.awayTeamId,
    },
    create: {
      slug: row.slug,
      league: row.league,
      round: row.round,
      matchday: row.matchday,
      venue: row.venue,
      kickoffAt: row.kickoffAt,
      status: row.status,
      homeScore: row.homeScore,
      awayScore: row.awayScore,
      homeTeamId: row.homeTeamId,
      awayTeamId: row.awayTeamId,
    },
  });
}

async function syncArticleTags(articleId, tagIds) {
  await prisma.articleTag.deleteMany({ where: { articleId } });
  if (tagIds.length === 0) return;
  await prisma.articleTag.createMany({
    data: tagIds.map((tagId) => ({ articleId, tagId })),
  });
}

async function main() {
  const admin = await upsertUser(SAMPLE_ADMIN, SAMPLE_ADMIN.password, "ADMIN");
  const reader = await upsertUser(SAMPLE_READER, SAMPLE_READER.password, "USER");

  console.log("Users:", SAMPLE_ADMIN.email, "/", SAMPLE_ADMIN.password, "|", SAMPLE_READER.email, "/", SAMPLE_READER.password);

  const catTongHop = await upsertCategory("tin-tong-hop", "Tin tổng hợp", "Diễn biến giải đấu và đội bóng.", 0);
  const catChuyenNhuong = await upsertCategory("chuyen-nhuong", "Chuyển nhượng", "Tin thị trường chuyển nhượng.", 1);
  const catGiaiDau = await upsertCategory("giai-dau", "Giải đấu", "Cup, lịch vòng loại, kết quả.", 2);
  const catBinhLuan = await upsertCategory("binh-luan", "Bình luận", "Góc nhìn phân tích.", 3);

  const tagVleague = await upsertTag("v-league", "V-League");
  const tagDoiTuyen = await upsertTag("doi-tuyen-viet-nam", "Đội tuyển Việt Nam");
  const tagCup = await upsertTag("cup-quoc-gia", "Cup Quốc gia");
  const tagTre = await upsertTag("cau-thu-tre", "Cầu thủ trẻ");
  const tagChuyenNhuong = await upsertTag("chuyen-nhuong", "Chuyển nhượng");

  const teams = await Promise.all(
    [
      { slug: "shb-da-nang", name: "SHB Đà Nẵng", shortName: "ĐN", country: "Việt Nam", stadium: "Hòa Xuân", logoUrl: null },
      { slug: "hoang-anh-gia-lai", name: "Hoàng Anh Gia Lai", shortName: "HAGL", country: "Việt Nam", stadium: "Pleiku", logoUrl: null },
      { slug: "becamex-binh-duong", name: "Becamex Bình Dương", shortName: "BD", country: "Việt Nam", stadium: "Gò Đậu", logoUrl: null },
      { slug: "hanoi-fc", name: "Hà Nội FC", shortName: "HN", country: "Việt Nam", stadium: "Hàng Đẫy", logoUrl: null },
      { slug: "cong-an-ha-noi", name: "Công an Hà Nội", shortName: "CAHN", country: "Việt Nam", stadium: "Hàng Đẫy", logoUrl: null },
      { slug: "the-cong-viettel", name: "Thể Công Viettel", shortName: "Viettel", country: "Việt Nam", stadium: "Mỹ Đình", logoUrl: null },
    ].map(upsertTeam),
  );

  const [tDn, tHagl, tBd, tHn, tCahn, tVt] = teams;

  const finished = [
    { slug: "m-demo-dn-hagl-1", home: tDn, away: tHagl, hs: 2, as: 1, day: -14, md: 1 },
    { slug: "m-demo-bd-hn-1", home: tBd, away: tHn, hs: 0, as: 2, day: -13, md: 1 },
    { slug: "m-demo-cahn-vt-1", home: tCahn, away: tVt, hs: 1, as: 1, day: -12, md: 1 },
    { slug: "m-demo-hagl-bd-1", home: tHagl, away: tBd, hs: 3, as: 0, day: -10, md: 2 },
    { slug: "m-demo-hn-dn-1", home: tHn, away: tDn, hs: 1, as: 0, day: -9, md: 2 },
    { slug: "m-demo-vt-cahn-1", home: tVt, away: tCahn, hs: 2, as: 1, day: -8, md: 2 },
    { slug: "m-demo-dn-bd-1", home: tDn, away: tBd, hs: 1, as: 1, day: -6, md: 3 },
    { slug: "m-demo-hagl-hn-1", home: tHagl, away: tHn, hs: 0, as: 2, day: -5, md: 3 },
    { slug: "m-demo-cahn-dn-1", home: tCahn, away: tDn, hs: 2, as: 0, day: -4, md: 3 },
  ];

  for (const f of finished) {
    await upsertMatch({
      slug: f.slug,
      league: DEMO_LEAGUE,
      round: "Vòng bảng",
      matchday: f.md,
      venue: f.home.stadium ?? "SVĐ trung lập",
      kickoffAt: dayOffset(f.day, 11),
      status: "FINISHED",
      homeScore: f.hs,
      awayScore: f.as,
      homeTeamId: f.home.id,
      awayTeamId: f.away.id,
    });
  }

  await upsertMatch({
    slug: "m-demo-live-sample",
    league: DEMO_LEAGUE,
    round: "Vòng bảng",
    matchday: 4,
    venue: tBd.stadium ?? "Gò Đậu",
    kickoffAt: dayOffset(0, 10),
    status: "LIVE",
    homeScore: 1,
    awayScore: 0,
    homeTeamId: tBd.id,
    awayTeamId: tHagl.id,
  });

  await upsertMatch({
    slug: "m-demo-schedule-1",
    league: DEMO_LEAGUE,
    round: "Vòng bảng",
    matchday: 4,
    venue: tHn.stadium ?? "Hàng Đẫy",
    kickoffAt: dayOffset(2, 12),
    status: "SCHEDULED",
    homeScore: null,
    awayScore: null,
    homeTeamId: tHn.id,
    awayTeamId: tVt.id,
  });

  await upsertMatch({
    slug: "m-demo-schedule-2",
    league: DEMO_LEAGUE,
    round: "Vòng bảng",
    matchday: 4,
    venue: tCahn.stadium ?? "Hàng Đẫy",
    kickoffAt: dayOffset(5, 12),
    status: "SCHEDULED",
    homeScore: null,
    awayScore: null,
    homeTeamId: tCahn.id,
    awayTeamId: tDn.id,
  });

  await upsertMatch({
    slug: "m-demo-cup-hn-hagl",
    league: "Cup Quốc gia — mẫu",
    round: "Vòng 16 đội",
    matchday: null,
    venue: "Mỹ Đình",
    kickoffAt: dayOffset(9, 18),
    status: "SCHEDULED",
    homeScore: null,
    awayScore: null,
    homeTeamId: tHn.id,
    awayTeamId: tHagl.id,
  });

  await prisma.comment.deleteMany({
    where: { article: { slug: { in: ARTICLE_SLUGS } } },
  });

  const pub = (d) => ({ publishedAt: d, status: "PUBLISHED" });

  const a1 = await prisma.article.upsert({
    where: { slug: ARTICLE_SLUGS[0] },
    update: {
      title: "Tổng hợp vòng 5 V.League mẫu: cuộc đua top 4 nóng lên",
      summary: "Các đội big city giành điểm quan trọng; Hà Nội FC thắng tối thiểu trên sân khách.",
      body: `<p>Vòng đấu thứ năm của giải mẫu chứng kiến nhiều trận cầu căng thẳng với tổng cộng hơn 20 bàn thắng.</p><p>Đội chủ nhà SHB Đà Nẵng có chiến thắng ấn tượng trước HAGL nhờ bộ đôi tiền đạo phối hợp ăn ý.</p><p>Bảng xếp hạng sẽ được cập nhật liên tục trên trang <strong>Bảng xếp hạng</strong>.</p>`,
      coverImageUrl: IMG.pitch,
      categoryId: catTongHop.id,
      authorId: admin.id,
      teamId: tDn.id,
      matchId: null,
      ...pub(dayOffset(-2, 8)),
    },
    create: {
      slug: ARTICLE_SLUGS[0],
      title: "Tổng hợp vòng 5 V.League mẫu: cuộc đua top 4 nóng lên",
      summary: "Các đội big city giành điểm quan trọng; Hà Nội FC thắng tối thiểu trên sân khách.",
      body: `<p>Vòng đấu thứ năm của giải mẫu chứng kiến nhiều trận cầu căng thẳng với tổng cộng hơn 20 bàn thắng.</p><p>Đội chủ nhà SHB Đà Nẵng có chiến thắng ấn tượng trước HAGL nhờ bộ đôi tiền đạo phối hợp ăn ý.</p><p>Bảng xếp hạng sẽ được cập nhật liên tục trên trang <strong>Bảng xếp hạng</strong>.</p>`,
      coverImageUrl: IMG.pitch,
      categoryId: catTongHop.id,
      authorId: admin.id,
      teamId: tDn.id,
      ...pub(dayOffset(-2, 8)),
    },
  });

  const a2 = await prisma.article.upsert({
    where: { slug: ARTICLE_SLUGS[1] },
    update: {
      title: "Chuyển nhượng: cầu thủ trẻ được CLB Nhật Bản theo dõi",
      summary: "Nguồn tin cho biết hai đội J2 League đã cử tuyển trạch viên sang Việt Nam xem giò.",
      body: `<p>Tiền vệ trung tâm 21 tuổi nổi bật ở khả năng chuyền chọc khoét và pressing.</p><p>Đại diện phía cầu thủ chưa xác nhận nhưng thương vụ có thể được thông báo sau kỳ chuyển nhượng mùa đông.</p>`,
      coverImageUrl: IMG.crowd,
      categoryId: catChuyenNhuong.id,
      authorId: admin.id,
      ...pub(dayOffset(-4, 9)),
    },
    create: {
      slug: ARTICLE_SLUGS[1],
      title: "Chuyển nhượng: cầu thủ trẻ được CLB Nhật Bản theo dõi",
      summary: "Nguồn tin cho biết hai đội J2 League đã cử tuyển trạch viên sang Việt Nam xem giò.",
      body: `<p>Tiền vệ trung tâm 21 tuổi nổi bật ở khả năng chuyền chọc khoét và pressing.</p><p>Đại diện phía cầu thủ chưa xác nhận nhưng thương vụ có thể được thông báo sau kỳ chuyển nhượng mùa đông.</p>`,
      coverImageUrl: IMG.crowd,
      categoryId: catChuyenNhuong.id,
      authorId: admin.id,
      ...pub(dayOffset(-4, 9)),
    },
  });

  const mCup = await prisma.match.findFirst({
    where: { slug: "m-demo-cup-hn-hagl" },
  });

  const a3 = await prisma.article.upsert({
    where: { slug: ARTICLE_SLUGS[2] },
    update: {
      title: "Cup Quốc gia (mẫu): lịch vòng 16 đội và cặp đấu đáng chú ý",
      summary: "Hà Nội FC gặp HAGL trên sân trung lập; vé dự kiến mở bán cuối tuần.",
      body: `<p>BTC đã chốt ngày giờ các cặp knock-out. Trận tâm điểm thu hút sự quan tâm lớn từ người hâm mộ hai miền.</p><p>Các đội V-League được nghỉ một tuần để tập trung cho cup.</p>`,
      coverImageUrl: IMG.stadium,
      categoryId: catGiaiDau.id,
      authorId: admin.id,
      matchId: mCup?.id ?? null,
      ...pub(dayOffset(-1, 7)),
    },
    create: {
      slug: ARTICLE_SLUGS[2],
      title: "Cup Quốc gia (mẫu): lịch vòng 16 đội và cặp đấu đáng chú ý",
      summary: "Hà Nội FC gặp HAGL trên sân trung lập; vé dự kiến mở bán cuối tuần.",
      body: `<p>BTC đã chốt ngày giờ các cặp knock-out. Trận tâm điểm thu hút sự quan tâm lớn từ người hâm mộ hai miền.</p><p>Các đội V-League được nghỉ một tuần để tập trung cho cup.</p>`,
      coverImageUrl: IMG.stadium,
      categoryId: catGiaiDau.id,
      authorId: admin.id,
      matchId: mCup?.id ?? null,
      ...pub(dayOffset(-1, 7)),
    },
  });

  const a4 = await prisma.article.upsert({
    where: { slug: ARTICLE_SLUGS[3] },
    update: {
      title: "Nhận định: trận “đinh” vòng 4 và yếu tố thể lực",
      summary: "Chuyên gia phân tích lối chơi pressing của đội khách và khả năng xoay tua đội hình.",
      body: `<p>Hai HLV đều ưa sơ đồ 4-3-3 nhưng hướng pressing khác nhau: một bên man-to-man, bên còn lại zonal.</p><p>Thể lực cuối trận có thể quyết định nếu cục diện hòa kéo dài đến phút 70.</p><p><em>Bài mang tính minh hoạ nội dung — không phải dự đoán thật.</em></p>`,
      coverImageUrl: IMG.ball,
      categoryId: catBinhLuan.id,
      authorId: admin.id,
      teamId: tHn.id,
      ...pub(dayOffset(-3, 14)),
    },
    create: {
      slug: ARTICLE_SLUGS[3],
      title: "Nhận định: trận “đinh” vòng 4 và yếu tố thể lực",
      summary: "Chuyên gia phân tích lối chơi pressing của đội khách và khả năng xoay tua đội hình.",
      body: `<p>Hai HLV đều ưa sơ đồ 4-3-3 nhưng hướng pressing khác nhau: một bên man-to-man, bên còn lại zonal.</p><p>Thể lực cuối trận có thể quyết định nếu cục diện hòa kéo dài đến phút 70.</p><p><em>Bài mang tính minh hoạ nội dung — không phải dự đoán thật.</em></p>`,
      coverImageUrl: IMG.ball,
      categoryId: catBinhLuan.id,
      authorId: admin.id,
      teamId: tHn.id,
      ...pub(dayOffset(-3, 14)),
    },
  });

  await syncArticleTags(a1.id, [tagVleague.id, tagDoiTuyen.id]);
  await syncArticleTags(a2.id, [tagChuyenNhuong.id, tagTre.id]);
  await syncArticleTags(a3.id, [tagCup.id, tagVleague.id]);
  await syncArticleTags(a4.id, [tagVleague.id]);

  await prisma.articleLocale.upsert({
    where: { articleId_locale: { articleId: a1.id, locale: "en" } },
    update: {
      slug: "round-5-demo-league-wrap-top-four-tightens",
      title: "Round 5 demo recap: the top-four race heats up",
      summary:
        "Big-city clubs take key points; Hà Nội FC grind out a narrow away win.",
      body: `<p>Matchday five of the sample league brought tight games and more than twenty goals.</p><p>SHB Đà Nẵng impressed at home against HAGL thanks to a sharp strike pair.</p><p>Standings update on the <strong>Standings</strong> page.</p>`,
    },
    create: {
      articleId: a1.id,
      locale: "en",
      slug: "round-5-demo-league-wrap-top-four-tightens",
      title: "Round 5 demo recap: the top-four race heats up",
      summary:
        "Big-city clubs take key points; Hà Nội FC grind out a narrow away win.",
      body: `<p>Matchday five of the sample league brought tight games and more than twenty goals.</p><p>SHB Đà Nẵng impressed at home against HAGL thanks to a sharp strike pair.</p><p>Standings update on the <strong>Standings</strong> page.</p>`,
    },
  });

  await prisma.articleLocale.upsert({
    where: { articleId_locale: { articleId: a2.id, locale: "en" } },
    update: {
      slug: "transfers-young-star-tracked-by-japanese-clubs",
      title: "Transfers: young star tracked by Japanese clubs",
      summary: "Two J2 sides reportedly sent scouts to Vietnam for a closer look.",
      body: `<p>The 21-year-old midfielder stands out for line-breaking passes and pressing.</p><p>No deal is confirmed yet; news may follow the winter window.</p>`,
    },
    create: {
      articleId: a2.id,
      locale: "en",
      slug: "transfers-young-star-tracked-by-japanese-clubs",
      title: "Transfers: young star tracked by Japanese clubs",
      summary: "Two J2 sides reportedly sent scouts to Vietnam for a closer look.",
      body: `<p>The 21-year-old midfielder stands out for line-breaking passes and pressing.</p><p>No deal is confirmed yet; news may follow the winter window.</p>`,
    },
  });

  await prisma.comment.createMany({
    data: [
      {
        articleId: a1.id,
        userId: reader.id,
        body: "Bài tổng hợp dễ đọc, mong thêm bảng thống kê cá nhân.",
      },
      {
        articleId: a1.id,
        userId: reader.id,
        body: "Đà Nẵng đá sân nhà hay thật!",
      },
      {
        articleId: a2.id,
        userId: reader.id,
        body: "Hy vọng cầu thủ được ra nước ngoài tích luỹ kinh nghiệm.",
      },
    ],
  });

  console.log("Seed nội dung mẫu:", DEMO_LEAGUE, "—", teams.length, "đội,", "bài:", ARTICLE_SLUGS.length);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
