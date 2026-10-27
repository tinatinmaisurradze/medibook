# MediBook

კლინიკების ონლაინ ჯავშნის სისტემა (React + TypeScript + Vite + Tailwind CSS).

## გაშვება

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build
```

## სადემონსტრაციო ანგარიშები (პაროლი: `Demo1234!`)

| როლი | ელ-ფოსტა |
| --- | --- |
| პაციენტი | patient@medibook.ge |
| ექიმი | doctor@medibook.ge |
| ადმინისტრატორი | admin@medibook.ge |

## ფუნქციები როლების მიხედვით

- **პაციენტი:** ექიმის ძებნა და ჯავშანი, ვიზიტის ანკეტა, შეფასება, პროფილი და სამედიცინო ისტორია (გაზიარების კონტროლით).
- **ექიმი:** დეშბორდი, კალენდარი, ვიზიტების სია, პაციენტების ბარათები, შეფასებები და პასუხები, პროფილი.
- **ადმინისტრატორი:** სტატისტიკა, გრაფიკები, კაბინეტები, გაუქმებები (სამედიცინო ჩანაწერებზე წვდომის გარეშე).

## არქიტექტურა

```
src/
├── components/   # გლობალური კომპონენტები (ui/, DoctorCard, ProtectedRoute, ...)
├── context/      # AuthContext, ToastContext
├── data/         # seed მონაცემები
├── hooks/        # useAsync, useDebounce
├── layouts/      # PublicLayout, DashboardLayout (ექიმი/ადმინი)
├── pages/        # გვერდები (doctor/, admin/ ქვეფოლდერებით)
├── services/     # http.ts, mockApi.ts, *Service.ts
├── types/        # TypeScript ინტერფეისები
└── utils/        # date, validation (Zod), roles
```

## Mock API

`src/services/mockApi.ts` ბრაუზერში მუშაობს და იმეორებს ტექნიკურ დავალებაში აღწერილ ენდფოინთებს
(`/api/auth/login`, `/api/doctors`, `/api/doctors/:id/slots`, `/api/appointments`, ...).
მონაცემები ინახება localStorage-ში (გასაღები `medibook_db_v2`), ყველა მოთხოვნა სერვერის მხარესაც მოწმდება Zod-ით, როლისა და ჩანაწერის მფლობელობის შემოწმებით. ნამდვილ სერვერზე გადასასვლელად საკმარისია `src/services/http.ts`-ის შეცვლა.

მონაცემების საწყის მდგომარეობაზე დასაბრუნებლად: ბრაუზერის კონსოლში `localStorage.clear()`.

## დეპლოი

Vercel ან Netlify: build command `npm run build`, output `dist`. SPA გადამისამართება უკვე გაწერილია
(`vercel.json`, `public/_redirects`).
