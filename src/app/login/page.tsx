"use client";

import { useState } from "react";
import Image from "next/image";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import {
  loginUser,
  selectAuthStatus,
  selectAuthError,
} from "@/features/auth/authSlice";

const formSchema = z.object({
  email: z.string().email({
    message: "Geçerli bir email adresi giriniz.",
  }),
  password: z.string().min(1, {
    message: "Şifre gereklidir.",
  }),
  rememberMe: z.boolean().optional(),
});

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useAppDispatch();
  const status = useAppSelector(selectAuthStatus);
  const authError = useAppSelector(selectAuthError);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  // dispatch ile thunk'ı çağır
  async function onSubmit(values: z.infer<typeof formSchema>) {
    const action = await dispatch(
      loginUser({ email: values.email, password: values.password }),
    );

    if (loginUser.fulfilled.match(action)) {
      toast.success("Başarıyla giriş yapıldı!");
      router.replace("/dashboard");
    } else {
      // authError içindeki mesajı göstermek istersen:
      toast.error(
        (action.payload as string) ||
          authError ||
          "Giriş başarısız. Lütfen bilgilerinizi kontrol edin.",
      );
      form.reset({ ...values, password: "" });
    }
  }

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden">
      {/* Arka plan görseli */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-900 to-blue-700 z-0">
        <Image
          src="/images/background.jpg"
          alt="Background"
          fill
          style={{ objectFit: "cover" }}
          quality={100}
          priority
        />
      </div>

      <div className="flex flex-row w-full max-w-6xl z-10 overflow-hidden rounded-xl shadow-2xl h-[550px]">
        {/* Sol taraf - Bilgiler */}
        <div className="flex-1 p-8 flex flex-col justify-center text-white relative">
          {/* Sadece sol taraf için bulanıklık katmanı */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] z-0"></div>

          <div className="mb-3 relative z-10">
            <h1 className="text-4xl font-bold mb-1">Commentius Manager</h1>
            <p className="text-lg opacity-90">
              Müşteri Memnuniyeti Yönetim Sistemi
            </p>
          </div>

          <div className="my-4 relative z-10">
            <h2 className="text-3xl font-semibold mb-1">
              Müşteri memnuniyeti süreçlerinizi yönetin.
            </h2>
            <p className="opacity-80 mt-2">
              Modern arayüz ve gelişmiş özelliklerle donatılmış müşteri
              memnuniyeti yönetim sistemimiz ile , işletmenizin verimliliğini
              artırın.
            </p>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 relative z-10">
            <div className="bg-white/20 backdrop-blur-md p-4 rounded-lg shadow-lg border border-white/30">
              <div className="text-blue-300 mb-2">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <h3 className="font-medium text-white">Güvenli Erişim</h3>
              <p className="text-sm text-white/90">
                Çift faktörlü kimlik doğrulama ile güçlendirilmiş güvenlik
              </p>
            </div>

            <div className="bg-white/20 backdrop-blur-md p-4 rounded-lg shadow-lg border border-white/30">
              <div className="text-blue-300 mb-2">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="font-medium text-white">Gerçek Zamanlı</h3>
              <p className="text-sm text-white/90">
                Anlık bildirimler ve güncel veriye hızlı erişim
              </p>
            </div>

            <div className="bg-white/20 backdrop-blur-md p-4 rounded-lg shadow-lg border border-white/30">
              <div className="text-blue-300 mb-2">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="font-medium text-white">Akıllı Raporlama</h3>
              <p className="text-sm text-white/90">
                Veriye dayalı iş kararları için analitik araçlar
              </p>
            </div>
          </div>
        </div>

        {/* Sağ taraf - Giriş formu */}
        <div className="flex-1 bg-white h-full flex flex-col">
          <div className="p-8 flex flex-col h-full">
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <Image
                src="/images/logo.png"
                alt="Logo"
                width={160}
                height={50}
                priority
              />
            </div>

            <div className="mb-6">
              <h2 className="text-2xl font-bold">Hesabınıza Giriş Yapın</h2>
              <p className="text-sm text-gray-500">
                Güvenli yönetim portalına erişmek için giriş yapın
              </p>
            </div>

            <div className="space-y-4 flex-1">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-posta</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <svg
                                className="h-5 w-5 text-gray-400"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                              </svg>
                            </div>
                            <Input
                              placeholder="ornek@sirket.com"
                              {...field}
                              className="pl-10 pr-3 py-2 h-11"
                              disabled={status === "loading"}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Şifre</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <svg
                                className="h-5 w-5 text-gray-400"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </div>
                            <Input
                              type={showPassword ? "text" : "password"}
                              placeholder="••••••••"
                              {...field}
                              className="pl-10 pr-10 py-2 h-11"
                              disabled={status === "loading"}
                            />
                            <button
                              type="button"
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                              onClick={() => setShowPassword(!showPassword)}
                              disabled={status === "loading"}
                            >
                              {showPassword ? (
                                <EyeOffIcon size={18} />
                              ) : (
                                <EyeIcon size={18} />
                              )}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="rememberMe"
                    render={({ field }) => (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="rememberMe"
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            checked={field.value}
                            onChange={field.onChange}
                            disabled={status === "loading"}
                          />
                          <label
                            htmlFor="rememberMe"
                            className="ml-2 block text-sm text-gray-700"
                          >
                            Beni hatırla (bu cihaz için)
                          </label>
                        </div>
                        <div className="text-sm">
                          <a
                            href="#"
                            className="text-blue-600 hover:text-blue-500"
                          >
                            Şifremi unuttum
                          </a>
                        </div>
                      </div>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 h-11"
                    disabled={status === "loading"}
                  >
                    {status === "loading" ? "Giriş yapılıyor..." : "Giriş Yap"}
                  </Button>
                </form>
              </Form>
            </div>

            <div className="mt-6 text-center">
              <div className="text-sm text-gray-600 mb-2">
                Yardıma mı ihtiyacınız var?
              </div>
              <div className="flex justify-center gap-4 text-sm">
                <a href="#" className="text-blue-600 hover:underline">
                  BT Desteği
                </a>
                <a href="#" className="text-blue-600 hover:underline">
                  Kullanım Kılavuzu
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
